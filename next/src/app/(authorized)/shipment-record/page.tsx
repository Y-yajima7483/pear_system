'use client';

import { useState, useCallback, useEffect } from 'react';
import YearMonthNavigation from './components/YearMonthNavigation';
import ShipmentRecordTable from './components/ShipmentRecordTable';
import ShipmentRecordRegisterDialog from './components/ShipmentRecordRegisterDialog';
import useGetApi from '@/lib/api/useGetApi';
import { commonApiHookOptions } from '@/lib/api/commonErrorHandlers';
import { SHIPMENT_TYPE_OPTIONS } from '@/constants/shipmentType';
import type { GetShipmentRecordListApiResponse, MonthOptionType, ShipmentTypeType } from '@/types/shipmentRecord';

export default function ShipmentRecordPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [data, setData] = useState<GetShipmentRecordListApiResponse | null>(null);
  const [monthOptions, setMonthOptions] = useState<MonthOptionType[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const { get, loading: getLoading } = useGetApi<GetShipmentRecordListApiResponse>(commonApiHookOptions);

  const shipmentTypes: ShipmentTypeType[] = SHIPMENT_TYPE_OPTIONS.map((opt) => ({ id: opt.value, name: opt.label }));

  // データ取得
  const fetchData = useCallback(async (year: number, month: number | null) => {
    const url = month !== null
      ? `/shipment-record?year=${year}&month=${month}`
      : `/shipment-record?year=${year}`;
    const res = await get(url);
    if (res.success && res.data) {
      setData(res.data);
      // 月フィルタなし(年全体)の場合のみ monthOptions を更新
      if (month === null) {
        const months = new Set<number>();
        res.data.records.forEach((record) => {
          months.add(new Date(record.record_date).getMonth() + 1);
        });
        setMonthOptions(
          Array.from(months)
            .sort((a, b) => b - a)
            .map((m) => ({ label: `${m}月`, value: m }))
        );
      }
    }
    setIsInitialLoading(false);
  }, [get]);

  useEffect(() => {
    fetchData(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth, fetchData]);

  // サマリーラベル
  const summaryLabel = selectedMonth
    ? `${selectedMonth}月 合計出荷数`
    : `${selectedYear}年 合計出荷数`;

  // 年変更時に月フィルターをリセット
  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setSelectedMonth(null);
  };

  const handleEdit = (id: number) => {
    // 将来の編集機能用
    console.log('Edit record:', id);
  };

  // 初期ローディング中
  if (isInitialLoading) {
    return (
      <div className="min-h-screen pear-bg flex items-center justify-center">
        <div className="pear-spinner"></div>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 md:px-8">
      {/* ナビゲーション */}
      <YearMonthNavigation
        year={selectedYear}
        onYearChange={handleYearChange}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        monthOptions={monthOptions}
        actionButton={
          <ShipmentRecordRegisterDialog onRecordCreated={() => fetchData(selectedYear, selectedMonth)} />
        }
      />

      {/* サマリー統計カード */}
      <div className={`transition-opacity duration-200 ${getLoading && !isInitialLoading ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="shipment-summary-row">
          <div className="shipment-stat-card shipment-stat-accent">
            <div className="shipment-stat-label">{summaryLabel}</div>
            <div className="shipment-stat-value">
              {(data?.summary.total_quantity ?? 0).toLocaleString()}
              <span className="shipment-stat-unit">個</span>
            </div>
          </div>
          {shipmentTypes.map((type) => (
            <div key={type.id} className="shipment-stat-card">
              <div className="shipment-stat-label">{type.name}</div>
              <div className="shipment-stat-value">
                {(data?.summary.quantities_by_type[type.id] ?? 0).toLocaleString()}
                <span className="shipment-stat-unit">個</span>
              </div>
            </div>
          ))}
        </div>

        {/* 出荷記録テーブル */}
        <ShipmentRecordTable records={data?.records ?? []} shipmentTypes={shipmentTypes} onEdit={handleEdit} />
      </div>
    </div>
  );
}
