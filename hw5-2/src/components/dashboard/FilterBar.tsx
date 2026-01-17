import React from 'react';
import { Input } from '@/components/ui/Input';
import { Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface FilterBarProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
}

export default function FilterBar({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  searchTerm,
  onSearchTermChange,
}: FilterBarProps) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm border">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder={t.dashboard.searchPlaceholder}
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <div className="flex items-center gap-2 w-full md:w-auto">
        <Input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="w-full md:w-auto"
        />
        <span className="text-gray-500">{t.dashboard.dateTo}</span>
        <Input
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="w-full md:w-auto"
        />
      </div>
    </div>
  );
}


