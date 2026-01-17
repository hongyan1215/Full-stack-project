import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Stats {
  totalExpense: number;
  totalIncome: number;
}

interface StatCardsProps {
  stats: Stats | null;
  loading: boolean;
}

export default function StatCards({ stats, loading }: StatCardsProps) {
  const { t } = useLanguage();
  const netBalance = (stats?.totalIncome || 0) - (stats?.totalExpense || 0);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="border-l-4 border-l-red-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">
            {t.dashboard.totalExpense}
          </CardTitle>
          <TrendingDown className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            ${stats?.totalExpense?.toLocaleString() || 0}
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">
            {t.dashboard.totalIncome}
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            ${stats?.totalIncome?.toLocaleString() || 0}
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">
            {t.dashboard.netBalance}
          </CardTitle>
          <DollarSign className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              netBalance >= 0 ? 'text-blue-600' : 'text-red-600'
            }`}
          >
            ${netBalance.toLocaleString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


