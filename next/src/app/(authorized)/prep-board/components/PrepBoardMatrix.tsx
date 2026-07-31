'use client';

import { Fragment, useMemo, useCallback } from 'react';
import { StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';
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

  // すべての商品が準備済みかどうかを判定
  const isAllItemsPrepared = (order: PrepBoardOrder) => {
    const items = Object.values(order.items);
    return items.length > 0 && items.every(item => item.is_prepared);
  };

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
            {orders.map(order => {
              const orderIsCompleted = isOrderCompleted(order.status);
              const orderHasNotes = order.notes?.trim();

              return (
                <Fragment key={order.id}>
                  <tr
                    className={cn(orderIsCompleted && 'prep-board-customer-row-completed')}
                  >
                    <td className="customer-cell">
                      <span className={cn(isAllItemsPrepared(order) && 'line-through text-gray-400')}>
                        {order.customer_name}
                      </span>
                    </td>
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
                          <button
                            className={cn(
                              'prep-board-status-badge',
                              item.is_prepared ? 'ready' : 'pending'
                            )}
                            onClick={() => handleCellClick(order.id, col.product_id, item.is_prepared)}
                          >
                            {item.quantity}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                  {orderHasNotes && (
                    <tr className="prep-board-order-notes-row">
                      <td className="customer-cell prep-board-order-notes-label-cell">
                        <span className="prep-board-order-notes-label">
                          <StickyNote aria-hidden="true" size={16} />
                          <span aria-hidden="true">備考</span>
                          <span className="sr-only">{order.customer_name}の備考</span>
                        </span>
                      </td>
                      <td
                        className="prep-board-order-notes-content-cell"
                        colSpan={productColumns.length}
                      >
                        <p className="prep-board-order-notes-content">{order.notes}</p>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}

            {/* 小計行 - 未準備 */}
            <tr className="prep-board-subtotal-row pending prep-board-subtotal-section-start">
              <td className="customer-cell">
                <span>未準備</span>
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
                <span>準備済</span>
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
