// 出荷タイプ型
export type ShipmentTypeType = {
  id: number;
  name: string;
};

// 出荷記録データ型
export type ShipmentRecordType = {
  id: number;
  record_date: string; // "yyyy-MM-dd"
  total_quantity: number;
  quantities_by_type: Record<number, number>;
  notes: string | null;
};

// サマリー統計型
export type ShipmentSummaryType = {
  total_quantity: number;
  quantities_by_type: Record<number, number>;
};

// APIレスポンス型
export type GetShipmentRecordListApiResponse = {
  records: ShipmentRecordType[];
  summary: ShipmentSummaryType;
};

// 月フィルターオプション型
export type MonthOptionType = {
  label: string;
  value: number;
};
