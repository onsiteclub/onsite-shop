import { NextRequest, NextResponse } from 'next/server';
import { sendShippedNotification } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { orderNumber, trackingCode, customerEmail } = await req.json();

    if (!orderNumber || !trackingCode || !customerEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await sendShippedNotification(orderNumber, trackingCode, customerEmail);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[NOTIFY-SHIPPED] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
  }
}
