import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getTransactionStats } from '@/lib/transaction';
import { QueryData } from '@/lib/ai';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('X-User-Id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();

    const searchParams = req.nextUrl.searchParams;
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    let startDate: string;
    let endDate: string;

    if (startDateStr && endDateStr) {
      startDate = new Date(startDateStr).toISOString();
      endDate = new Date(endDateStr).toISOString();
    } else {
      // Default to current month
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
    }

    const queryData: QueryData = {
      startDate,
      endDate,
      periodType: 'custom', // Default value to satisfy interface
    };

    const stats = await getTransactionStats(userId, queryData);

    const response = NextResponse.json({
        totalExpense: stats.totalExpense,
        totalIncome: stats.totalIncome,
        categoryBreakdown: stats.breakdown, // Renaming to match frontend expectation if needed, but frontend expects categoryBreakdown with { _id, total } which stats.breakdown has
    });

    // Cache stats for 30 seconds (stale-while-revalidate pattern)
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    
    return response;
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
