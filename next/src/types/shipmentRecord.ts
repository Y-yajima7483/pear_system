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

// --- 直売登録フォーム用型定義 ---

// 直売商品明細
export interface DirectSaleItemEntry {
  variety_id?: string;
  product_id: string;
  fruit_quantity: number;
  box_quantity: number;
}

// 商品に紐づかない、品種×等級単位の直売数量
export interface DirectSaleManualGradeEntry {
  variety_id: string;
  grade_id: string;
  quantity: number;
}

// 直売登録フォーム入力型
export interface DirectSaleFormInputs {
  record_date: string | Date;
  notes: string;
  direct_sale_items: DirectSaleItemEntry[];
  manual_grade_entries: DirectSaleManualGradeEntry[];
}

// 直売商品のデフォルト値
export const directSaleItemDefaultValues: DirectSaleItemEntry = {
  product_id: '',
  fruit_quantity: 0,
  box_quantity: 0,
};

// 直売upsert APIリクエスト型（PUT /shipment-record/direct-sale）
export interface UpsertDirectSaleRequest {
  record_date: string;
  notes?: string | null;
  direct_sale_items: {
    product_id: number;
    fruit_quantity: number;
    box_quantity: number;
  }[];
  manual_grade_entries: {
    variety_id: number;
    grade_id: number;
    quantity: number;
  }[];
}

// 登録・削除系APIの共通レスポンス型
export type ShipmentRecordMutationApiResponse =
  | { success: true; message: string }
  | { success: false; message: string };

// 種別単位削除APIレスポンス型
export type DeleteShipmentRecordApiResponse = ShipmentRecordMutationApiResponse & {
  record_deleted?: boolean;
};

// --- 日別詳細用型定義 ---

// 日別詳細: 商品明細
export type DailyShipmentProduct = {
  product_id: number;
  product_name: string;
  fruit_quantity: number;
  box_quantity: number;
};

// 日別詳細: 品種×等級明細
export type DailyShipmentDetail = {
  variety_id: number;
  variety_name: string;
  grade_id: number;
  grade_name: string;
  quantity: number;
  product_quantity: number;
  manual_quantity: number;
  products: DailyShipmentProduct[];
};

// 日別詳細: 出荷種別ごとのまとまり
export type DailyShipment = {
  shipment_type_id: number;
  total_quantity: number;
  details: DailyShipmentDetail[];
};

// 日別詳細レコード
export type ShipmentRecordDaily = {
  id: number;
  record_date: string;
  notes: string | null;
  shipments: DailyShipment[];
};

// 日別詳細APIレスポンス型（GET /shipment-record/daily/{date}）
export type GetShipmentRecordDailyApiResponse =
  | { success: true; record: ShipmentRecordDaily }
  | { success: false; message: string };

// --- 出荷サマリー（分析下地）用型定義 ---

export type ShipmentSummaryByVariety = {
  variety_id: number;
  variety_name: string;
  total_quantity: number;
  quantities_by_type: Record<number, number>;
};

export type ShipmentSummaryByGrade = {
  grade_id: number;
  grade_name: string;
  grade_type: 'sales' | 'non_sales';
  quantity: number;
};

// サマリーAPIレスポンス型（GET /shipment-record/summary）
export type GetShipmentSummaryApiResponse = {
  success: boolean;
  summary: {
    total_quantity: number;
    non_sales_quantity: number;
    loss_rate: number | null;
    by_variety: ShipmentSummaryByVariety[];
    by_grade: ShipmentSummaryByGrade[];
  };
};

// --- JA出荷登録用型定義 ---

// JA等級型
export type JaGradeType = {
  id: number;
  name: string;
};

// JA既存データ取得APIレスポンス型
export type GetJaShipmentDataApiResponse =
  | {
      success: true;
      grades: JaGradeType[];
      entries: Record<string, Record<string, number>>; // date -> gradeId -> quantity
    }
  | { success: false; message: string };

// JA出荷グリッド1日分の入力
export interface JaGridEntry {
  record_date: string;
  grades: Record<string, number>; // gradeId -> quantity
}

// JA出荷登録リクエスト型
export interface JaShipmentRegisterRequest {
  variety_id: number;
  entries: {
    record_date: string;
    grades: { grade_id: number; quantity: number }[];
  }[];
}

export type JaShipmentRegisterApiResponse =
  | { success: true; message: string; updated_dates: string[] }
  | { success: false; message: string };
