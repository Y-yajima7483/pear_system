'use client';

import React from 'react';
import type { FieldValues } from 'react-hook-form';
import type { MonthOptionType } from '@/types/shipmentRecord';
import SelectBoxBase from '@/components/input/SelectBoxBase';
import Button from '@/components/ui/Button';

interface YearMonthNavigationProps {
  year: number;
  onYearChange: (year: number) => void;
  selectedMonth: number | null;
  onMonthChange: (month: number | null) => void;
  monthOptions: MonthOptionType[];
  actionButton?: React.ReactNode;
}

export default function YearMonthNavigation({
  year,
  onYearChange,
  selectedMonth,
  onMonthChange,
  monthOptions,
  actionButton,
}: YearMonthNavigationProps) {
  const currentYear = new Date().getFullYear();
  const isCurrentYear = year === currentYear;

  const handlePrevYear = () => {
    onYearChange(year - 1);
  };

  const handleNextYear = () => {
    onYearChange(year + 1);
  };

  const handleThisYear = () => {
    onYearChange(currentYear);
  };

  return (
    <div className="flex items-center justify-between w-full flex-wrap gap-3">
      <div className="flex items-center gap-3 flex-wrap">
        {/* 年ナビゲーション */}
        <div className="flex items-center gap-2">
          <Button type="button" onClick={handlePrevYear} color="border" className="!w-9 !h-9 !p-0 !rounded-lg">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Button>

          <span className="date-nav-title">{year}年</span>

          <Button type="button" onClick={handleNextYear} color="border" className="!w-9 !h-9 !p-0 !rounded-lg">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Button>

          <Button type="button" onClick={handleThisYear} disabled={isCurrentYear} color="border" className="!px-4 !py-2 !text-xs !rounded-lg">
            今年
          </Button>
        </div>

        {/* 月フィルター */}
        {monthOptions.length > 0 && (
          <div className="w-40">
            <SelectBoxBase<FieldValues, number>
              name="month"
              inputLabel="すべての月"
              option={monthOptions}
              value={selectedMonth}
              onChange={onMonthChange}
            />
          </div>
        )}
      </div>

      {/* アクションボタン */}
      {actionButton && <div>{actionButton}</div>}
    </div>
  );
}
