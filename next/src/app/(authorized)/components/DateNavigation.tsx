'use client';

import React from 'react';
import { format, addDays, subDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '@/components/ui/Button';

interface DateNavigationProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export default function DateNavigation({ currentDate, onDateChange }: DateNavigationProps) {
  const handlePrevious = () => {
    onDateChange(subDays(currentDate, 7));
  };

  const handleNext = () => {
    onDateChange(addDays(currentDate, 7));
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const isToday = format(currentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="flex items-center gap-2">
      {/* 今日ボタン */}
      <Button
        type="button"
        onClick={handleToday}
        disabled={isToday}
        color="border"
        className="!px-4 !py-2 text-sm"
      >
        今日
      </Button>

      {/* ナビゲーションボタン */}
      <div className="flex items-center">
        <Button
          type="button"
          onClick={handlePrevious}
          color="border"
          className="!px-3 !py-2 !rounded-r-none"
        >
          <ChevronLeft size={20} />
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          color="border"
          className="!px-3 !py-2 !rounded-l-none !border-l-0"
        >
          <ChevronRight size={20} />
        </Button>
      </div>

      {/* 日付表示 */}
      <div className="text-lg font-medium text-gray-700 ml-2 min-w-[280px]">
        {format(currentDate, 'yyyy年M月d日', { locale: ja })} 〜 {format(addDays(currentDate, 6), 'M月d日', { locale: ja })}
      </div>
    </div>
  );
}
