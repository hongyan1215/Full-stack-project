'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Toaster, toast } from 'react-hot-toast';
import { Globe } from 'lucide-react';

import StatCards from '@/components/dashboard/StatCards';
import FilterBar from '@/components/dashboard/FilterBar';
import ChartSection from '@/components/dashboard/ChartSection';
import TransactionList, { Transaction } from '@/components/dashboard/TransactionList';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

interface Stats {
  totalExpense: number;
  totalIncome: number;
  categoryBreakdown: { _id: string; total: number }[];
}

export default function Dashboard() {
  const { language, setLanguage, t } = useLanguage();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 20;

  // Initialize date range
  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    // Format YYYY-MM-DD (local time consideration roughly)
    // To avoid timezone issues, we can just use the string representation of the local date
    const toDateInputString = (date: Date) => {
      const offset = date.getTimezoneOffset() * 60000;
      return new Date(date.getTime() - offset).toISOString().split('T')[0];
    };

    setStartDate(toDateInputString(start));
    setEndDate(toDateInputString(end));
  }, []);

  // Debounce search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset pagination when filters change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setTransactions([]);
    // We don't fetch here directly to avoid double fetching if strict mode or multiple deps change
    // Instead, we can depend on [debouncedSearchTerm, startDate, endDate] in the fetch effect 
    // OR simply call fetch here.
    // Let's use a dedicated fetch function and `useEffect` for dependencies.
  }, [debouncedSearchTerm, startDate, endDate]);

  const fetchTransactions = useCallback(async (isLoadMore = false) => {
    if (!startDate || !endDate) return;
    
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const queryParams = new URLSearchParams({
        startDate,
        endDate,
        page: isLoadMore ? (page + 1).toString() : '1',
        limit: LIMIT.toString(),
        search: debouncedSearchTerm,
      });

      const res = await fetch(`/api/transactions?${queryParams}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to fetch');

      const newTransactions = data.data || [];
      
      if (isLoadMore) {
        setTransactions((prev) => [...prev, ...newTransactions]);
        setPage((prev) => prev + 1);
      } else {
        setTransactions(newTransactions);
        setPage(1);
      }

      // Check if we have more pages
      const totalPages = data.pagination.totalPages;
      const currentPage = data.pagination.page;
      setHasMore(currentPage < totalPages);

    } catch (error) {
      console.error('Failed to fetch transactions', error);
      toast.error(t.dashboard.loadFailed);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [startDate, endDate, debouncedSearchTerm, page]);

  // Fetch Stats (only when filters change, not on load more)
  const fetchStats = useCallback(async () => {
    if (!startDate || !endDate) return;
    try {
      const queryParams = new URLSearchParams({
        startDate,
        endDate,
      });
      const res = await fetch(`/api/stats?${queryParams}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats', error);
      // Don't toast for stats failure to avoid spamming, or just log it
    }
  }, [startDate, endDate]);

  // Initial fetch and refetch on filter changes
  useEffect(() => {
    fetchTransactions(false);
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm, startDate, endDate]); // Intentionally omitting fetchTransactions to avoid circular deps if not careful, though useCallback handles it.

  const handleLoadMore = () => {
    fetchTransactions(true);
  };

  const handleUpdate = useCallback(async (id: string, data: Partial<Transaction>) => {
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) throw new Error('Failed to update');
      
      const updatedTransaction = await res.json();
      
      setTransactions((prev) => 
        prev.map((t) => (t._id === id ? updatedTransaction : t))
      );
      
      toast.success(t.dashboard.transactionUpdated);
      fetchStats(); // Refresh stats
    } catch (error) {
      console.error(error);
      toast.error(t.dashboard.updateFailed);
    }
  }, [fetchStats, t]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm(t.dashboard.deleteConfirm)) return;
    
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      
      setTransactions((prev) => prev.filter((t) => t._id !== id));
      toast.success(t.dashboard.transactionDeleted);
      fetchStats(); // Refresh stats
    } catch (error) {
      console.error(error);
      toast.error(t.dashboard.deleteFailed);
    }
  }, [fetchStats, t]);

  // Memoized Chart Data
  const chartData = useMemo(() => ({
    labels: stats?.categoryBreakdown.map((c) => c._id) || [],
    datasets: [
      {
        data: stats?.categoryBreakdown.map((c) => c.total) || [],
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#C9CBCF',
        ],
        borderWidth: 1,
      },
    ],
  }), [stats?.categoryBreakdown]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <Toaster position="top-right" />
      <div className="max-w-5xl mx-auto">
        <header className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{t.dashboard.title}</h1>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-gray-500" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'zh-TW' | 'en')}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="zh-TW">繁體中文</option>
              <option value="en">English</option>
            </select>
          </div>
        </header>

        {/* Filters */}
        <FilterBar
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
        />

        {/* Stats Grid */}
        <StatCards stats={stats} loading={loading && !transactions.length} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Section */}
          <div className="lg:col-span-1">
             <ChartSection 
               chartData={chartData} 
               loading={loading && !stats} 
               hasData={!!(stats && stats.totalExpense > 0)}
             />
          </div>

          {/* Transactions List Section */}
          <div className="lg:col-span-2">
            <TransactionList
              transactions={transactions}
              loading={loading || loadingMore}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
