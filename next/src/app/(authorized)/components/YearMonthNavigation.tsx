'use client';

import React from 'react';
import type { MonthOptionType } from '@/types/shipmentRecord';

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

  const handleMonthSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onMonthChange(value === '' ? null : Number(value));
  };

  const handleMonthClear = () => {
    onMonthChange(null);
  };

  return (
    <div className="flex items-center justify-between w-full flex-wrap gap-3">
      <div className="flex items-center gap-3 flex-wrap">
        {/* 年ナビゲーション */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevYear}
            className="date-nav-arrow-btn"
            title="前年"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <span className="date-nav-title">{year}年</span>

          <button
            type="button"
            onClick={handleNextYear}
            className="date-nav-arrow-btn"
            title="翌年"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          <button
            type="button"
            onClick={handleThisYear}
            disabled={isCurrentYear}
            className="date-nav-today-btn-outline"
          >
            今年
          </button>
        </div>

        {/* 月フィルター */}
        {monthOptions.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>絞り込み:</span>
            <select
              className="shipment-month-select"
              value={selectedMonth ?? ''}
              onChange={handleMonthSelect}
            >
              <option value="">すべての月</option>
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {selectedMonth !== null && (
              <button
                type="button"
                className="shipment-month-clear"
                onClick={handleMonthClear}
              >
                解除
              </button>
            )}
          </div>
        )}
      </div>

      {/* アクションボタン */}
      {actionButton && <div>{actionButton}</div>}
    </div>
  );
}
