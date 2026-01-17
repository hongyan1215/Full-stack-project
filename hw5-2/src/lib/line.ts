import { Client, RichMenu } from '@line/bot-sdk';
import fs from 'fs';
import path from 'path';

const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN!;
const channelSecret = process.env.LINE_CHANNEL_SECRET!;

const client = new Client({
  channelAccessToken,
  channelSecret,
});

export async function setupRichMenu(appUrl: string) {
  // 1. Define the Rich Menu
  const richMenu: RichMenu = {
    size: {
      width: 2500,
      height: 1686,
    },
    selected: false,
    name: 'MoneyBotMain',
    chatBarText: '開啟選單',
    areas: [
      // Top Row
      {
        bounds: { x: 0, y: 0, width: 833, height: 843 },
        action: {
          type: 'message',
          text: 'Dashboard', // 1. Modified: Trigger Dashboard
          label: '網頁後台',
        },
      },
      {
        bounds: { x: 833, y: 0, width: 834, height: 843 },
        action: {
          type: 'message',
          text: '這週花費', // 2. Weekly Stats
          label: '這週花費',
        },
      },
      {
        bounds: { x: 1667, y: 0, width: 833, height: 843 },
        action: {
          type: 'message',
          text: '本月統計', // 3. Monthly Stats
          label: '本月統計',
        },
      },
      // Bottom Row
      {
        bounds: { x: 0, y: 843, width: 833, height: 843 },
        action: {
          type: 'message',
          text: '列出本週明細', // 4. Transaction List
          label: '本週明細',
        },
      },
      {
        bounds: { x: 833, y: 843, width: 834, height: 843 },
        action: {
          type: 'message',
          text: '功能說明', // 5. Help
          label: '功能說明',
        },
      },
      {
        bounds: { x: 1667, y: 843, width: 833, height: 843 },
        action: {
          type: 'message',
          text: '有哪些分類？', // 6. Categories
          label: '分類列表',
        },
      },
    ],
  };

  console.log('Creating Rich Menu...');
  let richMenuId: string;
  try {
    richMenuId = await client.createRichMenu(richMenu);
  } catch (error: any) {
    console.error('Failed to create rich menu:', error.response?.data || error.message);
    throw new Error(`Create Rich Menu Failed: ${JSON.stringify(error.response?.data || error.message)}`);
  }
  console.log('Rich Menu created:', richMenuId);

  // 2. Upload Image
  // Note: In a real deployment, we might need to fetch this from a URL or use a local file if bundled.
  // For simplicity in this MVP, we'll assume there's a rich-menu.png in public folder
  // But reading public folder in Vercel serverless function is tricky.
  // A robust way is to fetch it from the deployed public URL.
  const imageUrl = `${appUrl}/rich-menu-template.jpg`; 
  // You will need to add a "rich-menu-template.jpg" to your public folder.
  // For now, let's try to fetch it.
  
  console.log('Fetching image from:', imageUrl);
  const imageResponse = await fetch(imageUrl);
  
  if (!imageResponse.ok) {
      throw new Error(`Failed to fetch rich menu image from ${imageUrl}`);
  }
  
  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

  console.log('Uploading image...');
  try {
    await client.setRichMenuImage(richMenuId, imageBuffer, 'image/jpeg');
  } catch (error: any) {
    console.error('Failed to upload rich menu image:', error.response?.data || error.message);
    // Try to clean up the created menu if image upload fails
    await client.deleteRichMenu(richMenuId);
    throw new Error(`Rich Menu Image Upload Failed: ${JSON.stringify(error.response?.data || error.message)}`);
  }

  // 3. Set as Default
  console.log('Setting as default...');
  await client.setDefaultRichMenu(richMenuId);

  console.log('Rich Menu setup complete!');
  return richMenuId;
}

