// Simple i18n system for dashboard
export type Language = 'zh-TW' | 'en';

export interface Translations {
  dashboard: {
    title: string;
    totalExpense: string;
    totalIncome: string;
    netBalance: string;
    expensesByCategory: string;
    noExpenseData: string;
    searchPlaceholder: string;
    dateTo: string;
    date: string;
    item: string;
    category: string;
    amount: string;
    actions: string;
    save: string;
    cancel: string;
    loadMore: string;
    loading: string;
    noTransactions: string;
    transactionUpdated: string;
    transactionDeleted: string;
    updateFailed: string;
    deleteFailed: string;
    loadFailed: string;
    deleteConfirm: string;
  };
  categories: {
    Food: string;
    Transport: string;
    Entertainment: string;
    Shopping: string;
    Bills: string;
    Salary: string;
    Other: string;
  };
}

const translations: Record<Language, Translations> = {
  'zh-TW': {
    dashboard: {
      title: '記帳助手 Dashboard',
      totalExpense: '總支出',
      totalIncome: '總收入',
      netBalance: '淨餘額',
      expensesByCategory: '支出類別分佈',
      noExpenseData: '無支出資料',
      searchPlaceholder: '搜尋交易...',
      dateTo: '至',
      date: '日期',
      item: '項目',
      category: '類別',
      amount: '金額',
      actions: '操作',
      save: '儲存',
      cancel: '取消',
      loadMore: '載入更多',
      loading: '載入中...',
      noTransactions: '無交易紀錄',
      transactionUpdated: '交易已更新',
      transactionDeleted: '交易已刪除',
      updateFailed: '更新失敗',
      deleteFailed: '刪除失敗',
      loadFailed: '載入失敗',
      deleteConfirm: '確定要刪除此交易嗎？',
    },
    categories: {
      Food: '餐飲',
      Transport: '交通',
      Entertainment: '娛樂',
      Shopping: '購物',
      Bills: '帳單',
      Salary: '薪水',
      Other: '其他',
    },
  },
  en: {
    dashboard: {
      title: 'Accounting Dashboard',
      totalExpense: 'Total Expense',
      totalIncome: 'Total Income',
      netBalance: 'Net Balance',
      expensesByCategory: 'Expenses by Category',
      noExpenseData: 'No expense data',
      searchPlaceholder: 'Search transactions...',
      dateTo: 'to',
      date: 'Date',
      item: 'Item',
      category: 'Category',
      amount: 'Amount',
      actions: 'Actions',
      save: 'Save',
      cancel: 'Cancel',
      loadMore: 'Load More',
      loading: 'Loading...',
      noTransactions: 'No transactions found',
      transactionUpdated: 'Transaction updated',
      transactionDeleted: 'Transaction deleted',
      updateFailed: 'Failed to update transaction',
      deleteFailed: 'Failed to delete transaction',
      loadFailed: 'Failed to load transactions',
      deleteConfirm: 'Are you sure you want to delete this transaction?',
    },
    categories: {
      Food: 'Food',
      Transport: 'Transport',
      Entertainment: 'Entertainment',
      Shopping: 'Shopping',
      Bills: 'Bills',
      Salary: 'Salary',
      Other: 'Other',
    },
  },
};

export function getTranslations(lang: Language): Translations {
  return translations[lang];
}

export function getCategoryName(category: string, lang: Language): string {
  const t = getTranslations(lang);
  return t.categories[category as keyof typeof t.categories] || category;
}

