'use client';

import React from 'react';
import { format, addDays, subDays } from 'date-fns';
import { ja } from 'date-fns/locale';

interface DateNavigationProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  actionButton?: React.ReactNode;
}

export default function DateNavigation({ currentDate, onDateChange, actionButton }: DateNavigationProps) {
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
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        {/* 今日ボタン */}
        <button
          type="button"
          onClick={handleToday}
          disabled={isToday}
          className="date-nav-today-btn-outline"
        >
          今日
        </button>

        {/* ナビゲーションボタン */}
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={handlePrevious}
            className="date-nav-arrow-btn"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="date-nav-arrow-btn"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* 日付表示 */}
        <h2 className="date-nav-title">
          {format(currentDate, 'yyyy年M月d日', { locale: ja })} 〜 {format(addDays(currentDate, 6), 'M月d日', { locale: ja })}
        </h2>

        {/* アクションボタン */}
        {actionButton && <div>{actionButton}</div>}
      </div>
    </div>
  );
}
