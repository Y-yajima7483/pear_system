'use client';

import React from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { ShipmentRecordType, ShipmentTypeType } from '@/types/shipmentRecord';

interface ShipmentRecordTableProps {
  records: ShipmentRecordType[];
  shipmentTypes: ShipmentTypeType[];
  onEdit: (id: number) => void;
}

export default function ShipmentRecordTable({ records, shipmentTypes, onEdit }: ShipmentRecordTableProps) {
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return format(date, 'M/d (E)', { locale: ja });
  };

  if (records.length === 0) {
    return (
      <div className="shipment-record-card">
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
          <p>この期間の出荷記録はありません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shipment-record-card">
      <div style={{ maxHeight: '520px', overflowY: 'auto', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table className="shipment-record-table">
          <thead>
            <tr>
              <th>日付</th>
              <th>合計数</th>
              {shipmentTypes.map((type) => (
                <th key={type.id}>{type.name}</th>
              ))}
              <th>備考</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>
                  <span className="shipment-record-date">{formatDate(record.record_date)}</span>
                </td>
                <td className="shipment-record-quantity">{record.total_quantity.toLocaleString()}</td>
                {shipmentTypes.map((type) => (
                  <td key={type.id}>{(record.quantities_by_type[type.id] ?? 0).toLocaleString()}</td>
                ))}
                <td className="shipment-record-notes">{record.notes ?? ''}</td>
                <td>
                  <button
                    type="button"
                    className="shipment-record-edit-btn"
                    onClick={() => onEdit(record.id)}
                  >
                    編集
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
