import mongoose from 'mongoose';
import Transaction from '@/models/Transaction';
import { ModificationData, QueryData } from '@/lib/ai';

// --- Types ---

export interface TransactionData {
  item: string;
  amount: number;
  category: string;
  type: string;
  date: Date | string;
}

export interface CreateResult {
  saved: any[];
  duplicates: string[];
}

export interface StatsResult {
  totalExpense: number;
  totalIncome: number;
  breakdown: { _id: string; total: number }[];
  transactionCount: number;
}

export interface TransactionDetail {
  item: string;
  amount: number;
  category: string;
  date: Date;
  type: 'expense' | 'income';
}

export interface TopExpenseResult {
  topCategory: { category: string; total: number } | null;
  topItem: { item: string; amount: number; date: Date } | null;
}

// --- Core Operations ---

/**
 * Create multiple transactions with validation, date parsing, and duplicate checking.
 */
export async function createTransactions(
  userId: string,
  transactions: TransactionData[]
): Promise<CreateResult> {
  const savedDocs = [];
  const duplicateItems = [];

  // Validation Filter
  const validTransactions = transactions.filter(t => t.item && t.amount && t.category && t.type);

  for (const t of validTransactions) {
    // Robust Date Parsing
    let dateObj = new Date(t.date);
    if (isNaN(dateObj.getTime())) {
      console.warn(`Invalid date received: ${t.date}, fallback to NOW.`);
      dateObj = new Date();
    }

    // Prepare data object
    const txData = {
      userId,
      item: t.item,
      amount: t.amount,
      category: t.category,
      type: t.type,
      date: dateObj
    };

    // Duplicate Check (5-minute window)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const duplicate = await Transaction.findOne({
      userId,
      item: txData.item,
      amount: txData.amount,
      category: txData.category,
      type: txData.type,
      date: { $gte: fiveMinutesAgo, $lte: new Date() }
    });

    if (duplicate) {
      duplicateItems.push(`${txData.item} $${txData.amount}`);
    } else {
      const doc = await Transaction.create(txData);
      savedDocs.push(doc);
    }
  }

  return { saved: savedDocs, duplicates: duplicateItems };
}

/**
 * Get spending statistics for a given period.
 * Optimized: Single aggregation pipeline to reduce database round trips.
 */
export async function getTransactionStats(
  userId: string,
  query: QueryData
): Promise<StatsResult> {
  const start = new Date(query.startDate);
  const end = new Date(query.endDate);

  const matchStage: any = {
    userId,
    date: { $gte: start, $lte: end },
  };

  if (query.category) {
    matchStage.category = query.category;
  }

  // Single aggregation pipeline for both totals and breakdown
  const results = await Transaction.aggregate([
    { $match: matchStage },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: '$type',
              total: { $sum: '$amount' },
              count: { $sum: 1 },
            },
          },
        ],
        breakdown: [
          {
            $match: { type: 'expense' },
          },
          {
            $group: {
              _id: '$category',
              total: { $sum: '$amount' },
            },
          },
          { $sort: { total: -1 } },
        ],
      },
    },
  ]);

  const result = results[0];
  let totalExpense = 0;
  let totalIncome = 0;
  let transactionCount = 0;

  result.totals.forEach((t: any) => {
    if (t._id === 'expense') totalExpense = t.total;
    if (t._id === 'income') totalIncome = t.total;
    transactionCount += t.count;
  });

  return {
    totalExpense,
    totalIncome,
    breakdown: result.breakdown,
    transactionCount,
  };
}

/**
 * Get a detailed list of transactions.
 */
export async function getTransactionList(
  userId: string,
  query: QueryData
): Promise<TransactionDetail[]> {
  const start = new Date(query.startDate);
  const end = new Date(query.endDate);

  const filter: any = {
    userId,
    date: { $gte: start, $lte: end },
  };

  if (query.category) {
    filter.category = query.category;
  }

  const transactions = await Transaction.find(filter)
    .sort({ date: -1 })
    .limit(20);

  return transactions.map(t => ({
    item: t.item,
    amount: t.amount,
    category: t.category,
    date: t.date,
    type: t.type as 'expense' | 'income'
  }));
}

/**
 * Get the top expense category and single item.
 */
export async function getTopExpense(
  userId: string,
  query: QueryData
): Promise<TopExpenseResult> {
  const start = new Date(query.startDate);
  const end = new Date(query.endDate);

  const matchStage = {
    userId,
    type: 'expense',
    date: { $gte: start, $lte: end },
  };

  // Top Category
  const categoryStats = await Transaction.aggregate([
    { $match: matchStage },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
    { $sort: { total: -1 } },
    { $limit: 1 }
  ]);

  // Top Single Item
  const itemStats = await Transaction.find(matchStage)
    .sort({ amount: -1 })
    .limit(1);

  return {
    topCategory: categoryStats.length > 0 ? { category: categoryStats[0]._id, total: categoryStats[0].total } : null,
    topItem: itemStats.length > 0 ? { item: itemStats[0].item, amount: itemStats[0].amount, date: itemStats[0].date } : null
  };
}

/**
 * Modify or delete a specific transaction.
 * Supports matching by item name, amount, or index offset.
 */
export async function modifyTransaction(
  userId: string,
  mod: ModificationData
): Promise<string> {
  let targetTx: any = null;
  let candidates: any[] = [];

  // Priority 1: Match by targetItem (item name)
  if (mod.targetItem) {
    const matched = await Transaction.find({ 
      userId, 
      item: { $regex: mod.targetItem, $options: 'i' } // Case-insensitive partial match
    })
    .sort({ createdAt: -1 })
    .limit(10);

    if (matched.length === 0) {
      return `找不到項目名稱包含「${mod.targetItem}」的交易紀錄。`;
    } else if (matched.length === 1) {
      targetTx = matched[0];
    } else {
      // Multiple matches found - return candidate list
      candidates = matched;
    }
  }
  // Priority 2: Match by targetAmount
  else if (mod.targetAmount !== undefined) {
    const matched = await Transaction.find({ 
      userId, 
      amount: mod.targetAmount 
    })
    .sort({ createdAt: -1 })
    .limit(10);

    if (matched.length === 0) {
      return `找不到金額為 $${mod.targetAmount} 的交易紀錄。`;
    } else if (matched.length === 1) {
      targetTx = matched[0];
    } else {
      // Multiple matches found - return candidate list
      candidates = matched;
    }
  }
  // Priority 3: Use indexOffset (fallback to last transaction)
  else {
    const limit = (mod.indexOffset || 0) + 1;
    const transactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);

    if (transactions.length === 0 || transactions.length < limit) {
      return '找不到可操作的交易紀錄。';
    }

    targetTx = transactions[limit - 1];
  }

  // If multiple candidates found, return list for user confirmation
  if (candidates.length > 0) {
    const candidateList = candidates.slice(0, 5).map((t, idx) => {
      const dateStr = new Date(t.date).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });
      return `${idx + 1}. ${dateStr} ${t.item} $${t.amount} (${t.category})`;
    }).join('\n');
    
    return `找到 ${candidates.length} 筆符合的交易，請指定要操作的項目：\n${candidateList}\n\n您可以說「刪除第1筆」或「刪除${candidates[0].item}那筆」來精確指定。`;
  }

  // Execute the action
  if (mod.action === 'DELETE') {
    await Transaction.findByIdAndDelete(targetTx._id);
    const dateStr = new Date(targetTx.date).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });
    return `✅ 已刪除：${dateStr} ${targetTx.item} $${targetTx.amount} (${targetTx.category})`;
  } else if (mod.action === 'UPDATE') {
    if (mod.newAmount !== undefined) targetTx.amount = mod.newAmount;
    if (mod.newItem) targetTx.item = mod.newItem;
    if (mod.newCategory) targetTx.category = mod.newCategory;
    
    await targetTx.save();
    const dateStr = new Date(targetTx.date).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });
    return `✅ 已更新為：${dateStr} ${targetTx.item} $${targetTx.amount} (${targetTx.category})`;
  }

  return '未知的操作指令。';
}

/**
 * Delete multiple transactions in a date range.
 */
export async function bulkDeleteTransactions(
  userId: string,
  query: QueryData
): Promise<string> {
  const start = new Date(query.startDate);
  const end = new Date(query.endDate);

  const filter: any = {
    userId,
    date: { $gte: start, $lte: end },
  };

  if (!query.startDate || !query.endDate) {
    return '批量刪除需要明確的日期範圍。';
  }

  const result = await Transaction.deleteMany(filter);

  if (result.deletedCount === 0) {
    return '該時段沒有可刪除的交易紀錄。';
  }

  return `已刪除 ${result.deletedCount} 筆交易紀錄 (${query.startDate.split('T')[0]} ~ ${query.endDate.split('T')[0]})。`;
}

