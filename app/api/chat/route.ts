import { streamText, convertToModelMessages, tool, jsonSchema } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createClient } from '@supabase/supabase-js';
import { getSystemPrompt } from '@/features/chat/config/system-prompt';
import { rateLimit } from '@/features/chat/lib/rate-limit';
import { getTracking } from '@/lib/canada-post/tracking';
import type { ChatLanguage } from '@/features/chat/types';

export const maxDuration = 30;

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function lookupOrder(orderNumber: string, email: string) {
  try {
    const supabase = getServiceClient();

    const { data: order, error } = await supabase
      .from('app_shop_orders')
      .select('order_number, status, tracking_code, created_at, shipped_at, items')
      .eq('order_number', orderNumber.trim().toUpperCase())
      .eq('email', email.trim().toLowerCase())
      .single();

    if (error || !order) {
      return { found: false, message: 'No order found with that number and email combination.' };
    }

    const itemNames = (order.items || [])
      .map((i: any) => `${i.name} (x${i.qty || 1})`)
      .join(', ');

    // If order has a tracking code, fetch live tracking from Canada Post
    let tracking = null;
    if (order.tracking_code) {
      try {
        const trackingResult = await getTracking(order.tracking_code);
        if (trackingResult.found) {
          tracking = {
            latestStatus: trackingResult.latestStatus,
            latestLocation: trackingResult.latestLocation,
            latestDate: trackingResult.latestDate,
            expectedDeliveryDate: trackingResult.expectedDeliveryDate,
            serviceName: trackingResult.serviceName,
            recentEvents: (trackingResult.events || []).map(e =>
              `${e.date} — ${e.description}${e.location ? ` (${e.location})` : ''}`
            ),
          };
        }
      } catch (err) {
        console.error('[chat] Tracking lookup error:', err);
      }
    }

    return {
      found: true,
      orderNumber: order.order_number,
      status: order.status,
      trackingCode: order.tracking_code || null,
      createdAt: order.created_at,
      shippedAt: order.shipped_at || null,
      items: itemNames || 'N/A',
      tracking,
    };
  } catch (err) {
    console.error('[chat] Order lookup error:', err);
    return { found: false, message: 'Could not look up order at this time.' };
  }
}

export async function POST(req: Request) {
  try {
    console.log('[chat] === REQUEST START ===');

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    const rateLimitResult = rateLimit(ip);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: 'Too many messages. Please wait a moment.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[chat] OPENAI_API_KEY set:', !!process.env.OPENAI_API_KEY);
    if (!process.env.OPENAI_API_KEY) {
      console.error('[chat] OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Chat service not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { messages, language = 'en' } = body;
    console.log('[chat] messages count:', messages?.length, 'language:', language);

    const validLangs: ChatLanguage[] = ['en', 'fr', 'pt'];
    const lang = validLangs.includes(language) ? language : 'en';

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No messages provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[chat] Converting messages...');
    const modelMessages = await convertToModelMessages(messages);
    console.log('[chat] Converted OK, modelMessages count:', modelMessages.length);

    console.log('[chat] Calling streamText...');
    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: getSystemPrompt(lang as ChatLanguage),
      messages: modelMessages,
      maxOutputTokens: 500,
      temperature: 0.3,
      tools: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        lookupOrder: tool({
          description:
            'Look up an order status by order number and customer email. ' +
            'Both fields are required for security verification. ' +
            'Ask the customer for both before calling this tool.',
          parameters: jsonSchema({
            type: 'object',
            properties: {
              orderNumber: { type: 'string', description: 'The order number (e.g. OS-MNPLDM10)' },
              email: { type: 'string', description: 'The customer email used when placing the order' },
            },
            required: ['orderNumber', 'email'],
          }),
          execute: async ({ orderNumber, email }: { orderNumber: string; email: string }) => {
            console.log('[chat] lookupOrder called:', orderNumber, email);
            return lookupOrder(orderNumber, email);
          },
        } as any),
      },
      onError: ({ error }) => {
        console.error('[chat] streamText onError:', error);
      },
    });
    console.log('[chat] streamText created OK, returning stream...');

    return result.toUIMessageStreamResponse();
  } catch (err: any) {
    console.error('[chat] CATCH Error:', err?.message || err);
    console.error('[chat] Stack:', err?.stack);
    return new Response(
      JSON.stringify({ error: err?.message || 'Chat failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
