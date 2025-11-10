// 店頭受け取り注文一覧取得APIレスポンス
export interface GetOrderListApiResponseContent<T=string> {
  id: number;
  customer_name: string;
  pickup_date: T;
  pickup_time: string | null;
  notes: string | null;
  status: 'pending'|'picked_up'|'canceled';
  items: Array<{variety_id: number, variety: string, product_id: number, item: string, quantity: number}>
}
// 店頭受け取り注文一覧取得APIレスポンス
export interface GetOrderListApiResponse {
  unreserved_data: Array<GetOrderListApiResponseContent<null>>;
  [date: string]: Array<GetOrderListApiResponseContent> | Array<GetOrderListApiResponseContent<null>>;
}

// 注文詳細データ（編集用）
export interface OrderDetailData {
  id: number;
  customer_name: string;
  notes: string;
  pickup_date: string | null;
  pickup_time: string | null;
  status: 'pending' | 'picked_up' | 'canceled';
  items: Array<{
    variety_id: number;
    variety_name: string;
    products: Array<{
      product_id: number;
      product_name: string;
      quantity: number;
    }>;
  }>;
}