'use client'

import React, { useEffect, useState, useRef } from 'react'
import { format } from 'date-fns';
import useGetApi from '@/lib/api/useGetApi'
import usePutApi from '@/lib/api/usePutApi';
import { overlayStore } from '@/stores/useOverlayStore';
import type { GetOrderListApiResponse, GetOrderListApiResponseContent } from '@/types/order';
import { orderItemStatus } from '@/types/order';
import { commonApiHookOptions } from '@/lib/api/commonErrorHandlers';
import OrderItemCard from './OrderItemCard';
import OrderDetailDialog from './OrderDetailDialog';
import OrderUpdateDialog from './OrderUpdateDialog';
import DroppableArea from './DroppableArea';
import type { OrderDetailData } from '@/types/order';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';

export type CalendarEvent = {
  id: string
  title: string
  start: Date
  end: Date
}

export type TwoWeekCalendarProps = {
  baseDate?: Date
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  hourStart?: number
  hourEnd?: number
  events?: CalendarEvent[]
}

interface OrderItemFortnightCalendarProps {
  refreshKey?: number;
  baseDate?: Date;
}

type PickupOrder = GetOrderListApiResponseContent | GetOrderListApiResponseContent<null>;

const getPickupTimeInMinutes = (pickupTime: string | null) => {
  if (!pickupTime) return Number.POSITIVE_INFINITY;

  const [hours, minutes] = pickupTime.split(':').map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return Number.POSITIVE_INFINITY;
  }

  return hours * 60 + minutes;
};

const compareOrdersByPickupPriority = (left: PickupOrder, right: PickupOrder) => {
  const leftIsPending = left.status === orderItemStatus.PENDING;
  const rightIsPending = right.status === orderItemStatus.PENDING;

  if (leftIsPending !== rightIsPending) {
    return leftIsPending ? -1 : 1;
  }

  if (!leftIsPending) return 0;

  const leftPickupTime = getPickupTimeInMinutes(left.pickup_time);
  const rightPickupTime = getPickupTimeInMinutes(right.pickup_time);

  if (leftPickupTime === rightPickupTime) return 0;

  return leftPickupTime < rightPickupTime ? -1 : 1;
};

const sortOrdersByPickupPriority = <T extends PickupOrder>(orders: T[]) => (
  [...orders].sort(compareOrdersByPickupPriority)
);

// 曜日を取得
const getDayOfWeek = (date: Date) => {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return days[date.getDay()];
};

export default function OrderItemFortnightCalendar({ refreshKey = 0, baseDate = new Date() }: OrderItemFortnightCalendarProps) {
  const { openOverlay, closeOverlay } = overlayStore();
  const {update, loading} = usePutApi(commonApiHookOptions);
  const { get: getOrderList } = useGetApi<GetOrderListApiResponse>(commonApiHookOptions);
  const [dateKeys, setDateKeys] = useState<string[]>([]);
  const [orderData, setOrderData] = useState<{[key: string]:Array<GetOrderListApiResponseContent>}>({});
  const [unreservedData, setUnreservedData] = useState<Array<GetOrderListApiResponseContent<null>>>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<GetOrderListApiResponseContent | GetOrderListApiResponseContent<null> | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [hasInitialScroll, setHasInitialScroll] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const prevBaseDateRef = useRef<Date>(baseDate);
  const calendarScrollRef = useRef<HTMLDivElement>(null);
  const dragStartStateRef = useRef<{
    sourceContainer: string | null;
    item: GetOrderListApiResponseContent | GetOrderListApiResponseContent<null> | null;
  }>({ sourceContainer: null, item: null });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchOrderUpdate = async({id, pickup_date}: {id:number, pickup_date:string|null})=> {
      const res = await update(`/order/${id}/pickup-date`, {
        pickup_date
      });
      return res.success;
  }

  const fetchOrderData = async () => {
    try {
      if (!isInitialLoading) {
        openOverlay();
      }
      const res = await getOrderList('/order', {
        params: {
          target_date: format(baseDate, 'yyyy-MM-dd')
        }
      });
      if(res.success) {
        const { unreserved_data, ...dateBasedData } = res.data;
        const dateOrders = dateBasedData as Record<string, GetOrderListApiResponseContent[]>;
        setUnreservedData(unreserved_data);
        const dates = Object.keys(dateOrders).sort();
        const sortedDateBasedData = Object.fromEntries(
          Object.entries(dateOrders).map(([date, orders]) => [
            date,
            sortOrdersByPickupPriority(orders),
          ])
        );
        setDateKeys(dates);
        setOrderData(sortedDateBasedData);
      }
    } finally {
      if (!isInitialLoading) {
        closeOverlay();
      }
      setIsInitialLoading(false);
    }
  };

  useEffect(()=> {
    const baseDateChanged = prevBaseDateRef.current.getTime() !== baseDate.getTime();
    if (baseDateChanged) {
      setIsInitialLoading(true);
      prevBaseDateRef.current = baseDate;
    }
    fetchOrderData();
    if (baseDateChanged) {
      setHasInitialScroll(false);
    }
  },[refreshKey, baseDate]);

  useEffect(() => {
    if (calendarScrollRef.current && !hasInitialScroll && dateKeys.length > 0) {
      calendarScrollRef.current.scrollLeft = 0;
      setHasInitialScroll(true);
    }
  }, [dateKeys, hasInitialScroll]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const id = Number(active.id);
    setActiveId(id);

    // ドラッグ開始時の状態を保存
    let sourceContainer: string | null = null;
    let item: GetOrderListApiResponseContent | GetOrderListApiResponseContent<null> | null = null;

    const unreservedItem = unreservedData.find(i => i.id === id);
    if (unreservedItem) {
      sourceContainer = 'unreserved';
      item = unreservedItem;
    } else {
      for (const [date, items] of Object.entries(orderData)) {
        const found = items.find(i => i.id === id);
        if (found) {
          sourceContainer = date;
          item = found;
          break;
        }
      }
    }

    dragStartStateRef.current = { sourceContainer, item };
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = Number(active.id);
    const overId = over.id;

    // ドロップ先のコンテナを特定
    let targetContainer: string | null = null;
    let overIndex = -1;

    // over.idがdate-で始まる場合はドロップエリア自体
    if (String(overId).startsWith('date-')) {
      targetContainer = String(overId).replace('date-', '');
    } else if (overId === 'unreserved') {
      targetContainer = 'unreserved';
    } else {
      // over.idが数値の場合は既存のカードの上にいる
      const overIdNum = Number(overId);

      // unreservedDataから探す
      const unreservedIndex = unreservedData.findIndex(item => item.id === overIdNum);
      if (unreservedIndex !== -1) {
        targetContainer = 'unreserved';
        overIndex = unreservedIndex;
      } else {
        // orderDataから探す
        for (const [date, items] of Object.entries(orderData)) {
          const idx = items.findIndex(item => item.id === overIdNum);
          if (idx !== -1) {
            targetContainer = date;
            overIndex = idx;
            break;
          }
        }
      }
    }

    if (!targetContainer) return;

    // activeアイテムの現在のコンテナを特定
    let sourceContainer: string | null = null;
    let activeIndex = -1;

    const unreservedActiveIndex = unreservedData.findIndex(item => item.id === activeId);
    if (unreservedActiveIndex !== -1) {
      sourceContainer = 'unreserved';
      activeIndex = unreservedActiveIndex;
    } else {
      for (const [date, items] of Object.entries(orderData)) {
        const idx = items.findIndex(item => item.id === activeId);
        if (idx !== -1) {
          sourceContainer = date;
          activeIndex = idx;
          break;
        }
      }
    }

    if (!sourceContainer) return;

    // 同じコンテナ内での並び替え
    if (sourceContainer === targetContainer && overIndex !== -1 && activeIndex !== overIndex) {
      if (sourceContainer === 'unreserved') {
        setUnreservedData(prev => arrayMove(prev, activeIndex, overIndex));
      } else {
        setOrderData(prev => ({
          ...prev,
          [sourceContainer]: arrayMove(prev[sourceContainer], activeIndex, overIndex)
        }));
      }
    }
    // 異なるコンテナ間の移動
    else if (sourceContainer !== targetContainer) {
      if (sourceContainer === 'unreserved') {
        const draggedItem = unreservedData[activeIndex];
        setUnreservedData(prev => prev.filter(item => item.id !== activeId));

        if (targetContainer === 'unreserved') {
          // このケースは発生しない
        } else {
          const insertIndex = overIndex !== -1 ? overIndex : (orderData[targetContainer]?.length || 0);
          setOrderData(prev => {
            const newItems = [...(prev[targetContainer] || [])];
            newItems.splice(insertIndex, 0, { ...draggedItem, pickup_date: targetContainer } as GetOrderListApiResponseContent);
            return { ...prev, [targetContainer]: newItems };
          });
        }
      } else {
        const draggedItem = orderData[sourceContainer][activeIndex];
        setOrderData(prev => ({
          ...prev,
          [sourceContainer]: prev[sourceContainer].filter(item => item.id !== activeId)
        }));

        if (targetContainer === 'unreserved') {
          const insertIndex = overIndex !== -1 ? overIndex : unreservedData.length;
          setUnreservedData(prev => {
            const newItems = [...prev];
            newItems.splice(insertIndex, 0, { ...draggedItem, pickup_date: null } as GetOrderListApiResponseContent<null>);
            return newItems;
          });
        } else {
          const insertIndex = overIndex !== -1 ? overIndex : (orderData[targetContainer]?.length || 0);
          setOrderData(prev => {
            const newItems = [...(prev[targetContainer] || [])];
            newItems.splice(insertIndex, 0, { ...draggedItem, pickup_date: targetContainer });
            return { ...prev, [targetContainer]: newItems };
          });
        }
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active } = event;
    const activeId = Number(active.id);

    // 現在のアイテムの位置を特定
    let currentContainer: string | null = null;
    let currentItem: GetOrderListApiResponseContent | GetOrderListApiResponseContent<null> | null = null;

    const unreservedItem = unreservedData.find(item => item.id === activeId);
    if (unreservedItem) {
      currentContainer = 'unreserved';
      currentItem = unreservedItem;
    } else {
      for (const [date, items] of Object.entries(orderData)) {
        const item = items.find(i => i.id === activeId);
        if (item) {
          currentContainer = date;
          currentItem = item;
          break;
        }
      }
    }

    // 開始時と異なるコンテナに移動した場合のみAPIを呼び出す
    const startState = dragStartStateRef.current;
    if (currentContainer && currentItem && startState.sourceContainer !== currentContainer) {
      openOverlay();
      const newPickupDate = currentContainer === 'unreserved' ? null : currentContainer;

      try {
        const res = await fetchOrderUpdate({
          id: activeId,
          pickup_date: newPickupDate
        });
        if (!res) throw new Error('更新に失敗しました');
      } catch (error) {
        // エラー時はデータを再取得して元に戻す
        await fetchOrderData();
      }
      closeOverlay();
    }

    setOrderData(prev => Object.fromEntries(
      Object.entries(prev).map(([date, orders]) => [
        date,
        sortOrdersByPickupPriority(orders),
      ])
    ));
    setActiveId(null);
    dragStartStateRef.current = { sourceContainer: null, item: null };
  };

  const getActiveItem = () => {
    if (!activeId) return null;

    const unreservedItem = unreservedData.find(item => item.id === activeId);
    if (unreservedItem) return unreservedItem;

    if (orderData) {
      for (const items of Object.values(orderData)) {
        const item = items.find(i => i.id === activeId);
        if (item) return item;
      }
    }

    return null;
  };

  const handleOrderDetailClick = (order: GetOrderListApiResponseContent | GetOrderListApiResponseContent<null>) => {
    setSelectedOrder(order);
    setIsDetailDialogOpen(true);
  };

  const handleEditClick = () => {
    setIsDetailDialogOpen(false);
    setIsEditDialogOpen(true);
  };

  const handleOrderUpdated = () => {
    fetchOrderData();
  };

  const convertToOrderDetailData = (order: GetOrderListApiResponseContent | GetOrderListApiResponseContent<null>): OrderDetailData | null => {
    if (!order) return null;

    const itemsByVariety: { [key: number]: { variety_id: number; variety_name: string; products: Array<{ id: number; product_id: number; product_name: string; quantity: number; is_prepared: boolean }> } } = {};

    order.items.forEach((item) => {
      const varietyKey = item.variety_id;

      if (!itemsByVariety[varietyKey]) {
        itemsByVariety[varietyKey] = {
          variety_id: item.variety_id,
          variety_name: item.variety,
          products: [],
        };
      }

      itemsByVariety[varietyKey].products.push({
        id: item.id,
        product_id: item.product_id,
        product_name: item.item,
        quantity: item.quantity,
        is_prepared: item.is_prepared,
      });
    });

    return {
      id: order.id,
      customer_name: order.customer_name,
      notes: order.notes || '',
      pickup_date: order.pickup_date || null,
      pickup_time: order.pickup_time || null,
      status: order.status,
      items: Object.values(itemsByVariety),
    };
  };

  // 統計計算
  const totalOrders = Object.values(orderData).reduce((sum, items) => sum + items.length, 0) + unreservedData.length;
  const unprocessedOrders = unreservedData.length;
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const todayOrders = orderData[todayKey]?.length || 0;

  // 日付列の最小高さを計算（カード1枚約120px、3枚分の余白を追加）
  const CARD_HEIGHT = 120;
  const EXTRA_CARDS = 3;
  const MIN_HEIGHT = 720;
  const calculateColumnHeight = (itemCount: number) => {
    const calculatedHeight = (itemCount + EXTRA_CARDS) * CARD_HEIGHT;
    return Math.max(MIN_HEIGHT, calculatedHeight);
  };
  const maxColumnHeight = Math.max(
    MIN_HEIGHT,
    ...Object.values(orderData).map(items => calculateColumnHeight(items.length))
  );

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-lg font-medium text-gray-600">注文データを読み込んでいます...</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      autoScroll={{
        threshold: {
          x: 0.15,
          y: 0.15,
        },
        acceleration: 15,
        interval: 5,
      }}
    >
      {/* Main Content Area */}
      <div className="flex gap-4">
        {/* Collapsible Sidebar - Unassigned Orders */}
        <div
          className={`sidebar-container flex-shrink-0 overflow-hidden transition-all duration-300 ${sidebarExpanded ? 'w-[220px]' : 'w-12'}`}
        >
          {/* Sidebar Header */}
          <div
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className={`sidebar-header cursor-pointer ${sidebarExpanded ? 'justify-between p-4' : 'justify-center p-3'}`}
          >
            {sidebarExpanded && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold pear-text-muted tracking-wide">
                  未登録注文
                </span>
                <span className="sidebar-count-badge">
                  {unreservedData.length}
                </span>
              </div>
            )}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`pear-text-muted transition-transform duration-300 ${!sidebarExpanded ? 'rotate-180' : ''}`}
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </div>

          {/* Sidebar Content */}
          {sidebarExpanded && (
            <DroppableArea id="unreserved" className="p-3 min-h-[420px]">
              <SortableContext
                items={unreservedData.map(item => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {unreservedData.map((order) => (
                  <OrderItemCard
                    key={order.id}
                    data={order}
                    onDetailClick={() => handleOrderDetailClick(order)}
                  />
                ))}
              </SortableContext>
            </DroppableArea>
          )}

          {/* Collapsed state indicator */}
          {!sidebarExpanded && (
            <div className="py-4 flex flex-col items-center gap-2">
              <span className="sidebar-count-badge">
                {unreservedData.length}
              </span>
              <span className="text-[10px] font-semibold pear-text-muted [writing-mode:vertical-rl] tracking-widest">
                未登録
              </span>
            </div>
          )}
        </div>

        {/* Calendar Grid */}
        <div
          ref={calendarScrollRef}
          className="calendar-grid flex-1 overflow-x-auto overflow-y-auto pear-scrollbar max-h-[calc(100vh-280px)]"
        >
          <div className="min-w-[2240px]">
            {/* Day Headers */}
            <div className="calendar-grid-7cols sticky top-0 z-10 calendar-header-border">
              {dateKeys.map((dateKey, index) => {
                const dateObj = new Date(dateKey);
                const isCurrentDate = dateKey === format(new Date(), 'yyyy-MM-dd');

                return (
                  <div
                    key={`hdr-${index}`}
                    className={`calendar-header py-3.5 px-2 text-center ${isCurrentDate ? 'today' : ''} ${index < 6 ? 'calendar-cell-border' : ''}`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span className={`calendar-date ${isCurrentDate ? 'today' : ''}`}>
                        {dateObj.getDate()}
                      </span>
                      <span className={`calendar-day ${isCurrentDate ? 'today' : ''}`}>
                        ({getDayOfWeek(dateObj)})
                      </span>
                      {isCurrentDate && <span className="calendar-today-marker" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Day Columns */}
            <div
              className="calendar-grid-7cols"
              style={{ minHeight: `${maxColumnHeight}px` }}
            >
              {dateKeys.map((dateKey, index) => {
                const dateItems = orderData?.[dateKey] || [];
                const isCurrentDate = dateKey === format(new Date(), 'yyyy-MM-dd');

                return (
                  <DroppableArea
                    key={`col-${index}`}
                    id={`date-${dateKey}`}
                    className={`calendar-cell p-1.5 ${isCurrentDate ? 'today' : ''}`}
                  >
                    <SortableContext
                      items={dateItems.map(item => item.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {dateItems.map((order) => (
                        <OrderItemCard
                          key={order.id}
                          data={order}
                          onDetailClick={() => handleOrderDetailClick(order)}
                        />
                      ))}
                    </SortableContext>
                  </DroppableArea>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        {[
          { label: '今週の注文', value: totalOrders.toString(), icon: '📦', colorClass: 'stat-primary' },
          { label: '未処理', value: unprocessedOrders.toString(), icon: '⏳', colorClass: 'stat-warning' },
          { label: '本日の受渡', value: todayOrders.toString(), icon: '🍐', colorClass: 'stat-success' },
        ].map((stat, index) => (
          <div key={index} className={`stat-card ${stat.colorClass}`}>
            <div className="stat-icon">
              {stat.icon}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="stat-label">{stat.label}</span>
              <span className="stat-value">{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      <DragOverlay>
        {activeId ? (
          <OrderItemCard data={getActiveItem()!} />
        ) : null}
      </DragOverlay>
      <OrderDetailDialog
        order={selectedOrder}
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        onEditClick={handleEditClick}
        onStatusChanged={handleOrderUpdated}
      />
      {selectedOrder && convertToOrderDetailData(selectedOrder) && (
        <OrderUpdateDialog
          orderData={convertToOrderDetailData(selectedOrder)!}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onOrderUpdated={handleOrderUpdated}
        />
      )}
    </DndContext>
  )
}
