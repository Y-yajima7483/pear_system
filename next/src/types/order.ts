// 店頭受け取り注文一覧取得APIレスポンス
export interface GetOrderListApiResponseContent<T=string> {
  id: number;
  customer_name: string;
  pickup_date: T;
  status: 'pending'|'picked_up'|'canceled';
  items: Array<{variety: string, item: string, quantity: number}>
}
// 店頭受け取り注文一覧取得APIレスポンス
export interface GetOrderListApiResponse {
  reserved_data: Array<GetOrderListApiResponseContent>;
  unreserved_data: Array<GetOrderListApiResponseContent<null>>
}