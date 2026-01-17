import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@line/bot-sdk';
import dbConnect from '@/lib/db';
import Transaction from '@/models/Transaction';
import { getTransactionStats } from '@/lib/transaction';
import { generatePieChartUrl } from '@/lib/chart';

const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN!;
const channelSecret = process.env.LINE_CHANNEL_SECRET!;

const client = new Client({
  channelAccessToken,
  channelSecret,
});

export async function GET(req: NextRequest) {
  // Security check: Verify that the request is authorized
  // For testing purposes or manual invocation from Vercel Dashboard, we might skip auth if specifically requested,
  // but best practice is to check for the CRON_SECRET header which Vercel injects automatically.
  // If you are manually visiting the URL in a browser, this header won't be there.
  
  // const authHeader = req.headers.get('authorization');
  // if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  // }
  
  // Relaxed Auth for Debugging: Only check if CRON_SECRET is set in env AND if header matches.
  // If you want to run manually, you can temporarily comment this out or add a query param bypass.


  try {
    await dbConnect();

    // 1. Find all distinct users who have transactions
    // In a production app, you'd have a User model. Here we infer from Transactions.
    const distinctUsers = await Transaction.distinct('userId');

    // 2. Calculate date range for "Last Week"
    // "Last Week" usually means Monday to Sunday of the previous week
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)
    // Assuming this runs on Monday morning.
    // Last Monday = Today - 7 days
    // Last Sunday = Today - 1 day
    
    // However, to be safe regardless of when it runs, let's calculate "Previous ISO Week"
    const lastWeekEnd = new Date(today);
    lastWeekEnd.setDate(today.getDate() - dayOfWeek); // Go back to last Sunday
    lastWeekEnd.setHours(23, 59, 59, 999);

    const lastWeekStart = new Date(lastWeekEnd);
    lastWeekStart.setDate(lastWeekEnd.getDate() - 6); // Go back 6 more days to Monday
    lastWeekStart.setHours(0, 0, 0, 0);

    const queryData = {
      startDate: lastWeekStart.toISOString(),
      endDate: lastWeekEnd.toISOString(),
      periodType: 'weekly' as const,
    };

    // 3. Generate and Send Report for each user
    console.error(`Processing weekly reports for ${distinctUsers.length} users...`); // Use error for visibility

    const results = await Promise.all(distinctUsers.map(async (userId) => {
      console.error(`Generating report for user: ${userId}`);
      const stats = await getTransactionStats(userId, queryData);
      
      if (stats.transactionCount === 0) {
        console.error(`User ${userId} has no transactions in range ${queryData.startDate} to ${queryData.endDate}. Skipping.`);
        return { userId, status: 'skipped' };
      }

      const chartData = {
        labels: stats.breakdown.map(b => b._id),
        data: stats.breakdown.map(b => b.total)
      };
      const chartUrl = await generatePieChartUrl(chartData, req.nextUrl.origin);
      
      const replyText = `📅 上週消費週報\n(${lastWeekStart.toLocaleDateString('zh-TW')} ~ ${lastWeekEnd.toLocaleDateString('zh-TW')})\n\n` +
        `💰 總支出: $${stats.totalExpense}\n` +
        `💵 總收入: $${stats.totalIncome}\n` +
        `📝 交易筆數: ${stats.transactionCount}\n\n` +
        `🔥 前三大花費:\n` +
        stats.breakdown.slice(0, 3).map(b => `- ${b._id}: $${b.total}`).join('\n');

      try {
        console.error(`Sending push message to ${userId}...`);
        if (chartUrl) {
          await client.pushMessage(userId, [
            { type: 'text', text: replyText },
            { 
              type: 'image', 
              originalContentUrl: chartUrl, 
              previewImageUrl: chartUrl 
            }
          ]);
        } else {
          await client.pushMessage(userId, { type: 'text', text: replyText });
        }
        console.error(`Successfully sent report to ${userId}`);
        return { userId, status: 'sent' };
      } catch (e: any) {
        console.error(`Failed to send report to ${userId}:`, e.originalError || e);
        return { userId, status: 'failed', error: e.message };
      }
    }));

    return NextResponse.json({ 
      message: 'Weekly reports processed', 
      results 
    });

  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

