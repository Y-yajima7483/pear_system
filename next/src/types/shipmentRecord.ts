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

// --- 登録フォーム用型定義 ---

// 品種ごとの等級入力
export interface ShipmentVarietyEntry {
  variety_id: string;
  grades: Record<string, number>; // gradeId -> quantity
}

// 直売商品明細
export interface DirectSaleItemEntry {
  product_id: string;
  fruit_quantity: number;
  box_quantity: number;
}

// 出荷タイプ別タブデータ
export interface ShipmentTypeTabData {
  shipment_type_id: number;
  varieties: ShipmentVarietyEntry[];
}

// 登録フォーム入力型
export interface ShipmentRecordFormInputs {
  record_date: string | Date;
  notes: string;
  tabs: ShipmentTypeTabData[];
  direct_sale_items: DirectSaleItemEntry[];
}

// 品種エントリのデフォルト値
export const varietyEntryDefaultValues: ShipmentVarietyEntry = {
  variety_id: '',
  grades: {},
};

// 直売商品のデフォルト値
export const directSaleItemDefaultValues: DirectSaleItemEntry = {
  product_id: '',
  fruit_quantity: 0,
  box_quantity: 0,
};
