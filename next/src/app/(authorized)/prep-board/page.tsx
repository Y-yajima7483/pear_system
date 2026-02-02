'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import DateNavigation from '../components/DateNavigation';
import PrepBoardMatrix from '../components/PrepBoardMatrix';
import OrderRegisterDialog from '../components/OrderRegisterDialog';
import useGetApi from '@/lib/api/useGetApi';
import usePatchApi from '@/lib/api/usePatchApi';
import { commonApiHookOptions } from '@/lib/api/commonErrorHandlers';
import { orderItemStatus } from '@/types/order';
import type { GetPrepBoardApiResponse, PrepBoardOrder } from '@/types/prepBoard';

export default function PrepBoardPage() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [data, setData] = useState<GetPrepBoardApiResponse | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const { get, loading: getLoading } = useGetApi<GetPrepBoardApiResponse>(commonApiHookOptions);
  const { patch } = usePatchApi(commonApiHookOptions);

  // データ取得
  const fetchData = useCallback(async () => {
    const targetDate = format(currentDate, 'yyyy-MM-dd');
    const res = await get(`/prep-board?target_date=${targetDate}`);
    if (res.success && res.data) {
      setData(res.data);
    }
    setIsInitialLoading(false);
  }, [currentDate, get]);

  // 初回データ取得
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 日付変更ハンドラ
  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
  };

  // 注文登録後のコールバック
  const handleOrderCreated = () => {
    fetchData();
  };

  // アイテムクリックハンドラ（準備状態の切り替え）
  const handleItemClick = async (orderId: number, productId: number, currentStatus: boolean) => {
    const res = await patch(`/order-item/${orderId}/${productId}/prepared`, {
      is_prepared: !currentStatus,
    });
    if (res.success) {
      fetchData();
    }
  };

  // 日付ごとの注文データを取得
  const getOrdersForDate = (dateKey: string): PrepBoardOrder[] => {
    if (!data) return [];
    return data.orders[dateKey] || [];
  };

  // 2日分の日付キー
  const dateKeys = useMemo(() => {
    const startDate = format(currentDate, 'yyyy-MM-dd');
    const nextDate = format(addDays(currentDate, 1), 'yyyy-MM-dd');
    return [startDate, nextDate];
  }, [currentDate]);

  // 統計情報を計算
  const statistics = useMemo(() => {
    if (!data) return { totalOrders: 0, pendingItems: 0, completedOrders: 0 };

    let totalOrders = 0;
    let pendingItems = 0;
    let completedOrders = 0;

    dateKeys.forEach(dateKey => {
      const orders = data.orders[dateKey] || [];
      totalOrders += orders.length;

      orders.forEach(order => {
        // 受取済みの注文をカウント
        if (order.status === orderItemStatus.PICKED_UP) {
          completedOrders++;
        }

        // 未準備アイテムをカウント
        Object.values(order.items).forEach(item => {
          if (!item.is_prepared) {
            pendingItems += item.quantity;
          }
        });
      });
    });

    return { totalOrders, pendingItems, completedOrders };
  }, [data, dateKeys]);

  // 日付ラベルをフォーマット
  const formatDateLabel = (dateKey: string): string => {
    const date = new Date(dateKey);
    return format(date, 'M月d日（E）', { locale: ja });
  };

  // 初期ローディング中
  if (isInitialLoading) {
    return (
      <div className="min-h-screen pear-bg flex items-center justify-center">
        <div className="pear-spinner"></div>
      </div>
    );
  }

  return (
    <>
      {/* ナビゲーションバー */}
      <nav className="prep-board-nav-bar">
        <DateNavigation
          currentDate={currentDate}
          onDateChange={handleDateChange}
          rangeMode="twodays"
          actionButton={<OrderRegisterDialog onOrderCreated={handleOrderCreated} />}
        />
      </nav>
      <div className="prep-board-main-content">
        <div className={`transition-opacity duration-200 ${getLoading && !isInitialLoading ? 'opacity-50 pointer-events-none' : ''}`}>
        {data && data.row_headers.length > 0 ? (
          <>
            {/* 1日目のマトリックス */}
            <PrepBoardMatrix
              rowHeaders={data.row_headers}
              orders={getOrdersForDate(dateKeys[0])}
              dateLabel={formatDateLabel(dateKeys[0])}
              onItemClick={handleItemClick}
            />

            {/* 2日目のマトリックス */}
            <PrepBoardMatrix
              rowHeaders={data.row_headers}
              orders={getOrdersForDate(dateKeys[1])}
              dateLabel={formatDateLabel(dateKeys[1])}
              onItemClick={handleItemClick}
            />
          </>
        ) : (
          <div className="text-center py-12 pear-text-muted">
            <p>この期間の注文はありません</p>
          </div>
        )}
        </div>
      </div>

      {/* フッターステータスバー */}
      <div className="prep-board-footer-bar">
        <div className="prep-board-footer-item">
          <div className="prep-board-footer-icon orders">📦</div>
          <div>
            <div className="prep-board-footer-label">2日間の注文</div>
            <div className="prep-board-footer-value primary">{statistics.totalOrders}件</div>
          </div>
        </div>
        <div className="prep-board-footer-item">
          <div className="prep-board-footer-icon pending">⏳</div>
          <div>
            <div className="prep-board-footer-label">未準備</div>
            <div className="prep-board-footer-value warning">{statistics.pendingItems}</div>
          </div>
        </div>
        <div className="prep-board-footer-item">
          <div className="prep-board-footer-icon done">✓</div>
          <div>
            <div className="prep-board-footer-label">本日の受渡</div>
            <div className="prep-board-footer-value success">{statistics.completedOrders}件</div>
          </div>
        </div>
      </div>
    </>
  );
}
