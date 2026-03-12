'use client';

import { useMemo } from 'react';
import type { JaGradeType, JaGridEntry } from '@/types/shipmentRecord';

interface JaShipmentGridProps {
  grades: JaGradeType[];
  gridData: JaGridEntry[];
  onCellChange: (dateIndex: number, gradeId: string, value: number) => void;
}

export default function JaShipmentGrid({ grades, gridData, onCellChange }: JaShipmentGridProps) {
  // 等級別合計
  const gradeTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    grades.forEach((g) => {
      totals[g.id.toString()] = 0;
    });
    gridData.forEach((entry) => {
      Object.entries(entry.grades).forEach(([gradeId, qty]) => {
        totals[gradeId] = (totals[gradeId] ?? 0) + (qty || 0);
      });
    });
    return totals;
  }, [grades, gridData]);

  // 行小計
  const getRowSubtotal = (grades: Record<string, number>) => {
    return Object.values(grades).reduce((sum, qty) => sum + (qty || 0), 0);
  };

  // 総合計
  const grandTotal = useMemo(() => {
    return Object.values(gradeTotals).reduce((sum, qty) => sum + qty, 0);
  }, [gradeTotals]);

  // 日付フォーマット (M/d)
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  if (grades.length === 0 || gridData.length === 0) {
    return null;
  }

  return (
    <div className="shipment-grade-table-wrapper">
      <table className="shipment-grade-table ja-grid-table">
        <thead>
          <tr>
            <th className="ja-grid-date-header">日付</th>
            {grades.map((grade) => (
              <th key={grade.id}>{grade.name}</th>
            ))}
            <th>小計</th>
          </tr>
        </thead>
        <tbody>
          {gridData.map((entry, dateIndex) => (
            <tr key={entry.record_date}>
              <td className="ja-grid-date-cell">
                {formatDate(entry.record_date)}
              </td>
              {grades.map((grade) => {
                const gradeKey = grade.id.toString();
                return (
                  <td key={grade.id}>
                    <input
                      type="number"
                      className="shipment-num-input"
                      value={entry.grades[gradeKey] ?? 0}
                      onChange={(e) =>
                        onCellChange(dateIndex, gradeKey, parseInt(e.target.value) || 0)
                      }
                      min={0}
                    />
                  </td>
                );
              })}
              <td className="shipment-row-subtotal">
                {getRowSubtotal(entry.grades)}
              </td>
            </tr>
          ))}
          {/* 合計行 */}
          <tr className="ja-grid-total-row">
            <td className="ja-grid-date-cell font-semibold">合計</td>
            {grades.map((grade) => (
              <td key={grade.id} className="shipment-row-subtotal">
                {gradeTotals[grade.id.toString()] ?? 0}
              </td>
            ))}
            <td className="shipment-row-subtotal font-bold">
              {grandTotal}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
