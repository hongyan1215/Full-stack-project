import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Edit2, Trash2, Save, X, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCategoryName } from '@/lib/i18n';

export interface Transaction {
  _id: string;
  date: string;
  item: string;
  amount: number;
  category: string;
  type: 'expense' | 'income';
}

interface TransactionListProps {
  transactions: Transaction[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onUpdate: (id: string, data: Partial<Transaction>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function TransactionList({
  transactions,
  loading,
  hasMore,
  onLoadMore,
  onUpdate,
  onDelete,
}: TransactionListProps) {
  const { language, t } = useLanguage();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Transaction>>({});

  const handleEditClick = (transaction: Transaction) => {
    setEditingId(transaction._id);
    setEditForm({ ...transaction, date: transaction.date.split('T')[0] });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSave = async () => {
    if (!editingId) return;
    await onUpdate(editingId, editForm);
    setEditingId(null);
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border shadow-sm">
        <p className="text-gray-500">{t.dashboard.noTransactions}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile View (Cards) */}
      <div className="block md:hidden space-y-4">
        {transactions.map((transaction) => (
          <Card key={transaction._id} className="overflow-hidden">
            <CardContent className="p-4">
              {editingId === transaction._id ? (
                <div className="space-y-3">
                  <Input
                    type="date"
                    value={editForm.date || ''}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  />
                  <Input
                    value={editForm.item || ''}
                    onChange={(e) => setEditForm({ ...editForm, item: e.target.value })}
                    placeholder={t.dashboard.item}
                  />
                  <div className="flex gap-2">
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={editForm.category || ''}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    >
                       {['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Other'].map(c => (
                         <option key={c} value={c}>{getCategoryName(c, language)}</option>
                       ))}
                    </select>
                    <Input
                      type="number"
                      value={editForm.amount || 0}
                      onChange={(e) => setEditForm({ ...editForm, amount: Number(e.target.value) })}
                      placeholder={t.dashboard.amount}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleSave} className="flex-1 bg-green-600 hover:bg-green-700">
                      <Save className="w-4 h-4 mr-2" /> {t.dashboard.save}
                    </Button>
                    <Button onClick={handleCancelEdit} variant="outline" className="flex-1">
                      <X className="w-4 h-4 mr-2" /> {t.dashboard.cancel}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">
                        {new Date(transaction.date).toLocaleDateString()}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border">
                        {getCategoryName(transaction.category, language)}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900 text-lg">{transaction.item}</h4>
                    <p
                      className={`font-bold text-lg ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-gray-900'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEditClick(transaction)}
                      className="h-8 w-8 text-blue-600"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onDelete(transaction._id)}
                      className="h-8 w-8 text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop View (Table) */}
      <div className="hidden md:block bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-gray-50 text-gray-600 text-sm uppercase">
                <th className="p-4">{t.dashboard.date}</th>
                <th className="p-4">{t.dashboard.item}</th>
                <th className="p-4">{t.dashboard.category}</th>
                <th className="p-4 text-right">{t.dashboard.amount}</th>
                <th className="p-4 text-center">{t.dashboard.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transactions.map((transaction) => (
                <tr key={transaction._id} className="hover:bg-gray-50">
                  {editingId === transaction._id ? (
                    <>
                      <td className="p-4">
                        <Input
                          type="date"
                          value={editForm.date || ''}
                          onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                        />
                      </td>
                      <td className="p-4">
                        <Input
                          value={editForm.item || ''}
                          onChange={(e) => setEditForm({ ...editForm, item: e.target.value })}
                        />
                      </td>
                      <td className="p-4">
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={editForm.category || ''}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        >
                          {['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Other'].map(c => (
                            <option key={c} value={c}>{getCategoryName(c, language)}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4 text-right">
                        <Input
                          type="number"
                          value={editForm.amount || 0}
                          onChange={(e) => setEditForm({ ...editForm, amount: Number(e.target.value) })}
                          className="text-right"
                        />
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button size="sm" onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-4 text-sm text-gray-600">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td className="p-4 font-medium text-gray-900">{transaction.item}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border">
                          {getCategoryName(transaction.category, language)}
                        </span>
                      </td>
                      <td className={`p-4 text-right font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-gray-900'}`}>
                        {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(transaction)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(transaction._id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={loading}
            className="w-full md:w-auto min-w-[200px]"
          >
            {loading ? t.dashboard.loading : (
              <>
                {t.dashboard.loadMore} <ChevronDown className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}


