import mongoose from 'mongoose';
import Budget, { IBudget } from '@/models/Budget';
import Transaction from '@/models/Transaction';

export interface BudgetStatus {
  category: string;
  limit: number;
  spent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
}

/**
 * Set or update a budget for a specific category (or 'Total').
 */
export async function setBudget(userId: string, category: string, amount: number): Promise<IBudget> {
  const budget = await Budget.findOneAndUpdate(
    { userId, category },
    { amount, period: 'monthly' },
    { upsert: true, new: true }
  );
  return budget;
}

/**
 * Get the status of all budgets for the user (current month).
 */
export async function getBudgetStatus(userId: string): Promise<BudgetStatus[]> {
  // 1. Fetch all budgets for the user
  const budgets = await Budget.find({ userId });
  if (budgets.length === 0) return [];

  // 2. Calculate start and end of the current month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // 3. Aggregate expenses for the current month
  const expenses = await Transaction.aggregate([
    {
      $match: {
        userId,
        type: 'expense',
        date: { $gte: startOfMonth, $lte: endOfMonth }
      }
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' }
      }
    }
  ]);

  // Calculate total expense for 'Total' budget
  const totalExpense = expenses.reduce((sum, item) => sum + item.total, 0);

  // 4. Map budgets to status
  const statusList: BudgetStatus[] = budgets.map(budget => {
    let spent = 0;
    if (budget.category === 'Total') {
      spent = totalExpense;
    } else {
      const categoryExpense = expenses.find(e => e._id === budget.category);
      spent = categoryExpense ? categoryExpense.total : 0;
    }

    const percentage = Math.round((spent / budget.amount) * 100);

    return {
      category: budget.category,
      limit: budget.amount,
      spent,
      remaining: budget.amount - spent,
      percentage,
      isOverBudget: spent > budget.amount
    };
  });

  return statusList;
}

/**
 * Check budget status for a specific category after a transaction.
 * Returns a warning message if budget is exceeded or close to limit (>= 80%).
 */
export async function checkBudgetAlert(userId: string, category: string): Promise<string | null> {
  const budgets = await Budget.find({
    userId,
    category: { $in: [category, 'Total'] }
  });

  if (budgets.length === 0) return null;

  // Calculate stats (reuse logic efficiently or just do a quick query)
  // For alert, we want the latest status including the just-recorded transaction
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const stats = await Transaction.aggregate([
    {
      $match: {
        userId,
        type: 'expense',
        date: { $gte: startOfMonth }
      }
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' }
      }
    }
  ]);

  const totalExpense = stats.reduce((sum, item) => sum + item.total, 0);
  const categoryExpense = stats.find(e => e._id === category)?.total || 0;

  const alerts: string[] = [];

  for (const budget of budgets) {
    let spent = 0;
    if (budget.category === 'Total') {
      spent = totalExpense;
    } else if (budget.category === category) {
      spent = categoryExpense;
    }

    const percentage = (spent / budget.amount) * 100;

    if (percentage >= 100) {
      alerts.push(`⚠️【${budget.category === 'Total' ? '總預算' : budget.category}】已超支！(${Math.round(percentage)}%)`);
    } else if (percentage >= 80) {
      alerts.push(`⚠️【${budget.category === 'Total' ? '總預算' : budget.category}】已用 ${Math.round(percentage)}%`);
    }
  }

  return alerts.length > 0 ? alerts.join('\n') : null;
}


