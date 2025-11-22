import { NextResponse } from 'next/server';
import { validateSignature, WebhookEvent } from '@line/bot-sdk';
import { lineService, lineConfig } from '@/services/LineService';
import { gameService } from '@/services/GameService';

// Configure runtime for Vercel (optional, but can help with performance)
export const runtime = 'nodejs';
export const maxDuration = 30; // Vercel Pro plan allows up to 300s, Hobby is 10s

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-line-signature') || '';

    if (!lineConfig.channelSecret) {
      console.error('LINE_CHANNEL_SECRET is not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (!validateSignature(body, lineConfig.channelSecret, signature)) {
      console.error('Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const data = JSON.parse(body);
    const events: WebhookEvent[] = data.events;

    // Process events in parallel
    await Promise.all(
      events.map(async (event) => {
        // We only care about Message events with Text type for now
        if (event.type === 'message' && event.message.type === 'text') {
          const userId = event.source.userId;
          if (!userId) return;

          try {
            const replyText = await gameService.handleMessage(userId, event.message.text);
            
            if (event.replyToken && replyText) {
              await lineService.replyMessage(event.replyToken, [
                {
                  type: 'text',
                  text: replyText,
                },
              ]);
            }
          } catch (error) {
            console.error('Error handling message:', error);
            // Graceful degradation: Send user-friendly error message
            if (event.replyToken) {
              try {
                await lineService.replyMessage(event.replyToken, [
                  {
                    type: 'text',
                    text: '*無線電訊號受到嚴重干擾...（請稍後重試）*',
                  },
                ]);
              } catch (replyError) {
                console.error('Failed to send error reply:', replyError);
              }
            }
          }
        }
      })
    );

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

