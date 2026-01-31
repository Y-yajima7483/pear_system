// 準備ボードAPI関連の型定義

// 商品情報（行ヘッダー用）
export interface PrepBoardProduct {
  product_id: number;
  product_name: string;
}

// 品種情報（行ヘッダー用）
export interface PrepBoardVariety {
  variety_id: number;
  variety_name: string;
  products: PrepBoardProduct[];
}

// 注文アイテム（product_idをキーにしたマップ形式）
export interface PrepBoardOrderItem {
  quantity: number;
  is_prepared: boolean;
}

// 注文データ
export interface PrepBoardOrder {
  id: number;
  customer_name: string;
  status: number;
  items: Record<string, PrepBoardOrderItem>; // product_idをキーにしたマップ
}

// 日付別注文データ
export type PrepBoardOrdersByDate = Record<string, PrepBoardOrder[]>;

// 準備ボードAPIレスポンス
export interface GetPrepBoardApiResponse {
  row_headers: PrepBoardVariety[];
  orders: PrepBoardOrdersByDate;
}

// 商品列情報（フラット化した配列用）
export interface ProductColumn {
  variety_id: number;
  variety_name: string;
  product_id: number;
  product_name: string;
}

// 小計データ
export interface SubtotalData {
  pending: Record<number, number>; // product_id -> 数量
  ready: Record<number, number>;   // product_id -> 数量
  total: Record<number, number>;   // product_id -> 数量
}
