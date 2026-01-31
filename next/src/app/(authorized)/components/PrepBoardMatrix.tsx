'use client';

import { useMemo, useCallback } from 'react';
import { orderItemStatus } from '@/types/order';
import type {
  PrepBoardVariety,
  PrepBoardOrder,
  ProductColumn,
  SubtotalData,
} from '@/types/prepBoard';

interface PrepBoardMatrixProps {
  rowHeaders: PrepBoardVariety[];
  orders: PrepBoardOrder[];
  dateLabel: string;
  onItemClick?: (orderId: number, productId: number, currentStatus: boolean) => void;
}

export default function PrepBoardMatrix({
  rowHeaders,
  orders,
  dateLabel,
  onItemClick,
}: PrepBoardMatrixProps) {
  // 商品列をフラット化
  const productColumns = useMemo<ProductColumn[]>(() => {
    return rowHeaders.flatMap(variety =>
      variety.products.map(product => ({
        variety_id: variety.variety_id,
        variety_name: variety.variety_name,
        product_id: product.product_id,
        product_name: product.product_name,
      }))
    );
  }, [rowHeaders]);

  // 品種ごとの商品数（colspanに使用）
  const varietyColspans = useMemo(() => {
    return rowHeaders.map(variety => ({
      variety_id: variety.variety_id,
      variety_name: variety.variety_name,
      colspan: variety.products.length,
    }));
  }, [rowHeaders]);

  // 小計を計算
  const subtotals = useMemo<SubtotalData>(() => {
    const pending: Record<number, number> = {};
    const ready: Record<number, number> = {};
    const total: Record<number, number> = {};

    // 初期化
    productColumns.forEach(col => {
      pending[col.product_id] = 0;
      ready[col.product_id] = 0;
      total[col.product_id] = 0;
    });

    // 集計（受取済みの注文も含める）
    orders.forEach(order => {
      productColumns.forEach(col => {
        const item = order.items[String(col.product_id)];
        if (item) {
          total[col.product_id] += item.quantity;
          if (item.is_prepared) {
            ready[col.product_id] += item.quantity;
          } else {
            pending[col.product_id] += item.quantity;
          }
        }
      });
    });

    return { pending, ready, total };
  }, [orders, productColumns]);

  // セルクリックハンドラ
  const handleCellClick = useCallback((orderId: number, productId: number, currentStatus: boolean) => {
    if (onItemClick) {
      onItemClick(orderId, productId, currentStatus);
    }
  }, [onItemClick]);

  // 注文が受取済みかどうかを判定
  const isOrderCompleted = (status: number) => status === orderItemStatus.PICKED_UP;

  return (
    <section className="prep-board-day-section">
      <div className="prep-board-day-header">
        <h3>
          <span>📅</span>
          {dateLabel}
        </h3>
      </div>

      <div className="prep-board-table-container">
        <table className="prep-board-matrix-table">
          <thead>
            {/* 品種ヘッダー行 */}
            <tr>
              <th className="customer-cell" rowSpan={2}>顧客名</th>
              {varietyColspans.map(variety => (
                <th
                  key={variety.variety_id}
                  className="variety-group"
                  colSpan={variety.colspan}
                >
                  {variety.variety_name}
                </th>
              ))}
            </tr>
            {/* 商品ヘッダー行 */}
            <tr>
              {productColumns.map(col => (
                <th key={col.product_id} className="product-type">
                  {col.product_name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* 顧客行 */}
            {orders.map(order => (
              <tr
                key={order.id}
                className={isOrderCompleted(order.status) ? 'prep-board-customer-row-completed' : ''}
              >
                <td className="customer-cell">{order.customer_name}</td>
                {productColumns.map(col => {
                  const item = order.items[String(col.product_id)];
                  if (!item) {
                    return (
                      <td key={col.product_id} className="prep-board-status-cell">
                        <span className="prep-board-empty-cell">−</span>
                      </td>
                    );
                  }
                  return (
                    <td key={col.product_id} className="prep-board-status-cell">
                      <span
                        className={`prep-board-status-badge ${item.is_prepared ? 'ready' : 'pending'}`}
                        onClick={() => handleCellClick(order.id, col.product_id, item.is_prepared)}
                      >
                        {item.quantity}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* 小計行 - 未準備 */}
            <tr className="prep-board-subtotal-row pending prep-board-subtotal-section-start">
              <td className="customer-cell">
                <span className="prep-board-subtotal-icon"></span>
              </td>
              {productColumns.map(col => (
                <td
                  key={col.product_id}
                  className={subtotals.pending[col.product_id] === 0 ? 'prep-board-subtotal-zero' : ''}
                >
                  {subtotals.pending[col.product_id]}
                </td>
              ))}
            </tr>

            {/* 小計行 - 準備済 */}
            <tr className="prep-board-subtotal-row ready">
              <td className="customer-cell">
                <span className="prep-board-subtotal-icon"></span>
              </td>
              {productColumns.map(col => (
                <td
                  key={col.product_id}
                  className={subtotals.ready[col.product_id] === 0 ? 'prep-board-subtotal-zero' : ''}
                >
                  {subtotals.ready[col.product_id]}
                </td>
              ))}
            </tr>

            {/* 合計行 */}
            <tr className="prep-board-subtotal-row total">
              <td className="customer-cell">合計</td>
              {productColumns.map(col => (
                <td key={col.product_id}>
                  {subtotals.total[col.product_id]}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
