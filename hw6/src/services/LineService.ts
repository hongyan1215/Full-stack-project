import { Client, messagingApi } from '@line/bot-sdk';

const clientConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
};

export class LineService {
  private client: messagingApi.MessagingApiClient;

  constructor() {
    if (!clientConfig.channelAccessToken) {
      console.warn('LINE_CHANNEL_ACCESS_TOKEN is not set');
    }
    this.client = new messagingApi.MessagingApiClient(clientConfig);
  }

  public async replyMessage(replyToken: string, messages: messagingApi.Message[]) {
    try {
      return await this.client.replyMessage({
        replyToken,
        messages,
      });
    } catch (error) {
      console.error('Error sending LINE reply:', error);
      throw error;
    }
  }

  public async pushMessage(to: string, messages: messagingApi.Message[]) {
    try {
      // Note: pushMessage might need different ID formatting or UUIDv4 for retry key if using advanced features
      // but the basic SDK method usually just takes the push request object.
      // However, the new types are strict. Let's check the method signature if possible or assume standard usage.
      // Actually, MessagingApiClient has pushMessage(pushMessageRequest: PushMessageRequest)
      return await this.client.pushMessage({
        to,
        messages,
      });
    } catch (error) {
      console.error('Error sending LINE push:', error);
      throw error;
    }
  }

  // Static helper for signature verification if needed, 
  // though @line/bot-sdk provides middleware or we can implement manual check.
  // Next.js App Router creates raw body handling challenges, so we'll likely need a helper in the route.
}

export const lineService = new LineService();
export const lineConfig = clientConfig;

