import { streamText, convertToModelMessages } from 'ai';
import { openai } from '@ai-sdk/openai';
import { getSystemPrompt } from '@/features/chat/config/system-prompt';
import { rateLimit } from '@/features/chat/lib/rate-limit';
import type { ChatLanguage } from '@/features/chat/types';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
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

    if (!process.env.OPENAI_API_KEY) {
      console.error('[chat] OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Chat service not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { messages, language = 'en' } = await req.json();

    const validLangs: ChatLanguage[] = ['en', 'fr', 'pt'];
    const lang = validLangs.includes(language) ? language : 'en';

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No messages provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: getSystemPrompt(lang as ChatLanguage),
      messages: modelMessages,
      maxOutputTokens: 500,
      temperature: 0.3,
    });

    return result.toUIMessageStreamResponse();
  } catch (err: any) {
    console.error('[chat] Error:', err?.message || err);
    return new Response(
      JSON.stringify({ error: err?.message || 'Chat failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
