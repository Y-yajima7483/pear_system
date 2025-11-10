'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import useGetApi from '@/lib/api/useGetApi'
import usePutApi from '@/lib/api/usePutApi';
import { overlayStore } from '@/stores/useOverlayStore';
import type { GetOrderListApiResponse, GetOrderListApiResponseContent } from '@/types/order';
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
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
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

function formatDayLabel(date: Date, locale: string = 'ja-JP') {
  const wd = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date)
  const md = new Intl.DateTimeFormat(locale, { month: 'numeric', day: 'numeric' }).format(date)
  return `${md} (${wd})`
}

interface OrderItemFortnightCalendarProps {
  refreshKey?: number;
  baseDate?: Date;
}

export default function OrderItemFortnightCalendar({ refreshKey = 0, baseDate = new Date() }: OrderItemFortnightCalendarProps) {
  const { openOverlay, closeOverlay } = overlayStore();
  const {update, loading} = usePutApi(commonApiHookOptions);
  const { get: getOrderList } = useGetApi<GetOrderListApiResponse>(commonApiHookOptions);
  // バックエンドから受け取った日付キー配列（unreserved_dataを除く）
  const [dateKeys, setDateKeys] = useState<string[]>([]);
  const minInnerWidth = 10 + 7 * 350;
  const [orderData, setOrderData] = useState<{[key: string]:Array<GetOrderListApiResponseContent>}>({});
  const [unreservedData, setUnreservedData] = useState<Array<GetOrderListApiResponseContent<null>>>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<GetOrderListApiResponseContent | GetOrderListApiResponseContent<null> | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [hasInitialScroll, setHasInitialScroll] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const prevBaseDateRef = useRef<Date>(baseDate);
  const calendarScrollRef = useRef<HTMLDivElement>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  // 受け取り日更新
  const fetchOrderUpdate = async({id, pickup_date}: {id:number, pickup_date:string|null})=> {
      const res = await update(`/order/${id}/pickup-date`, {
        pickup_date
      });
      return res.success;
  }
  
  const fetchOrderData = async () => {
    try {
      // 初回ロード以外は既存のオーバーレイを使用
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

        // unreserved_dataを設定
        setUnreservedData(unreserved_data);

        // 日付キーのみを抽出してソート（unreserved_dataを除く）
        const dates = Object.keys(dateBasedData).sort();
        setDateKeys(dates);

        // 注文データを設定
        setOrderData(dateBasedData as {[key: string]: Array<GetOrderListApiResponseContent>});
      }
    } finally {
      if (!isInitialLoading) {
        closeOverlay();
      }
      setIsInitialLoading(false);
    }
  };
  
  useEffect(()=> {
    // baseDateが変更された場合のみローディング状態をリセット
    const baseDateChanged = prevBaseDateRef.current.getTime() !== baseDate.getTime();
    if (baseDateChanged) {
      setIsInitialLoading(true);
      prevBaseDateRef.current = baseDate;
    }

    fetchOrderData();

    // baseDateが変更されたらスクロール初期化フラグをリセット
    if (baseDateChanged) {
      setHasInitialScroll(false);
    }
  },[refreshKey, baseDate]);

  // 初期表示時に現在の日付までスクロール（一度だけ実行）
  useEffect(() => {
    if (calendarScrollRef.current && !hasInitialScroll && dateKeys.length > 0) {
      // 先頭にスクロール（1週間表示なので常に先頭から表示）
      calendarScrollRef.current.scrollLeft = 0;
      setHasInitialScroll(true);
    }
  }, [dateKeys, hasInitialScroll]);
  
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(Number(active.id));
  };
  
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    openOverlay();
    const activeId = Number(active.id);
    const overId = String(over.id);
    
    // ドロップ先が日付列の場合
    if (overId.startsWith('date-')) {
      const targetDate = overId.replace('date-', '');
      
      // 未登録データからの移動
      const draggedItemFromUnreserved = unreservedData.find(item => item.id === activeId);
      if (draggedItemFromUnreserved) {
        // 楽観的更新
        setUnreservedData(prev => prev.filter(item => item.id !== activeId));
        setOrderData(prev => ({
          ...prev,
          [targetDate]: [...(prev?.[targetDate] || []), { ...draggedItemFromUnreserved, pickup_date: targetDate }]
        }));
        
        // APIコール
        try {
          const res = await fetchOrderUpdate({
            id: activeId,
            pickup_date: targetDate
          });
          if(!res) throw new Error('更新に失敗しました');
        } catch (error) {
          // エラー時はロールバック
          setUnreservedData(prev => [...prev, draggedItemFromUnreserved]);
          setOrderData(prev => ({
            ...prev,
            [targetDate]: prev[targetDate].filter(item => item.id !== activeId)
          }));
        }
      } else {
        // 既存の日付から別の日付への移動
        let draggedItem: GetOrderListApiResponseContent | undefined;
        let sourceDate: string | undefined;
        
        if (orderData) {
          for (const [date, items] of Object.entries(orderData)) {
            const item = items.find(i => i.id === activeId);
            if (item) {
              draggedItem = item;
              sourceDate = date;
              break;
            }
          }
        }
        
        if (draggedItem && sourceDate && sourceDate !== targetDate) {
          // 楽観的更新
          setOrderData(prev => {
            const newData = { ...prev };
            newData[sourceDate] = newData[sourceDate].filter(item => item.id !== activeId);
            newData[targetDate] = [...(newData[targetDate] || []), { ...draggedItem, pickup_date: targetDate }];
            return newData;
          });
          
          // APIコール
          try {
            const res = await fetchOrderUpdate({
              id: activeId,
              pickup_date: targetDate
            });
            if(!res) throw new Error('更新に失敗しました');
          } catch (error) {
            // エラー時はロールバック
            setOrderData(prev => {
              const newData = { ...prev };
              newData[targetDate] = newData[targetDate].filter(item => item.id !== activeId);
              newData[sourceDate] = [...(newData[sourceDate] || []), draggedItem];
              return newData;
            });
          }
        }
      }
    } else if (overId === 'unreserved') {
      // 日付列から未登録エリアへの移動
      let draggedItem: GetOrderListApiResponseContent | undefined;
      let sourceDate: string | undefined;
      
      if (orderData) {
        for (const [date, items] of Object.entries(orderData)) {
          const item = items.find(i => i.id === activeId);
          if (item) {
            draggedItem = item;
            sourceDate = date;
            break;
          }
        }
      }
      
      if (draggedItem && sourceDate) {
        // 楽観的更新
        setOrderData(prev => ({
          ...prev,
          [sourceDate]: prev![sourceDate].filter(item => item.id !== activeId)
        }));
        setUnreservedData(prev => [...prev, { ...draggedItem, pickup_date: null }]);
        
        // APIコール
        try {
          const res = await fetchOrderUpdate({
            id: activeId,
            pickup_date: null
          });
          if(!res) throw new Error('更新に失敗しました');
        } catch (error) {
          // エラー時はロールバック
          setUnreservedData(prev => prev.filter(item => item.id !== activeId));
          setOrderData(prev => ({
            ...prev,
            [sourceDate]: [...prev![sourceDate], draggedItem]
          }));
        }
      }
    }
    closeOverlay();
    setActiveId(null);
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

  // GetOrderListApiResponseContent を OrderDetailData に変換
  const convertToOrderDetailData = (order: GetOrderListApiResponseContent | GetOrderListApiResponseContent<null>): OrderDetailData | null => {
    if (!order) return null;

    // items を variety_id でグループ化
    const itemsByVariety: { [key: number]: { variety_id: number; variety_name: string; products: Array<{ product_id: number; product_name: string; quantity: number }> } } = {};

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
        product_id: item.product_id,
        product_name: item.item,
        quantity: item.quantity,
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

  // 初期ロード中はローディング画面を表示
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
      onDragEnd={handleDragEnd}
    >
      <div className="flex">
        <div className="w-[27%] h-[85vh] overflow-x-auto overflow-y-auto pt-2">
          <div
            className="w-full h-12 border-l border-t border-b border-gray-900 bg-white px-3 flex items-center text-sm font-medium"
          >
            受け取り日未登録注文
          </div>
          <DroppableArea id="unreserved" className="min-h-full">
            <SortableContext 
              items={unreservedData.map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-8 px-1 py-4">
                {unreservedData.map((data)=> (
                  <OrderItemCard
                    key={data.id}
                    data={data}
                    onDetailClick={() => handleOrderDetailClick(data)}
                  />
                ))}
              </div>
            </SortableContext>
          </DroppableArea>
        </div>
        <div className="w-[73%] pt-2">
          <div ref={calendarScrollRef} className="w-full h-[85vh] overflow-x-auto overflow-y-auto border border-gray-900">
            <div className="h-full" style={{ minWidth: `${minInnerWidth}px` }}>
              <div className="h-full grid [grid-template-columns:10px_repeat(7,minmax(250px,1fr))]">
                <div className="h-12 sticky top-0 z-10" />
                {dateKeys.map((dateKey, idx) => {
                  const dateItems = orderData?.[dateKey] || [];
                  const isCurrentDate = dateKey === format(new Date(), 'yyyy-MM-dd');
                  // yyyy-MM-dd形式の文字列から日付オブジェクトを作成してラベル表示
                  const dateObj = new Date(dateKey);
                  return (
                    <div key={`hdr-${idx}`} className="flex flex-wrap h-full">
                      <div
                        className={`w-full h-12 border-b border-l border-gray-900 px-3 flex items-center text-sm font-medium ${
                          isCurrentDate ? 'bg-blue-50 text-blue-900 font-bold' : 'bg-white'
                        }`}
                      >
                        {formatDayLabel(dateObj)}
                      </div>
                      <DroppableArea
                        id={`date-${dateKey}`}
                        className={`w-full h-full border-l border-gray-900 bg-blue-50/20 ${
                          isCurrentDate ? 'bg-blue-50/20' : ''
                        }`}
                      >
                        <SortableContext
                          items={dateItems.map(item => item.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="px-1 py-4 space-y-4 min-h-[200px]">
                            {dateItems.map((data)=> (
                              <OrderItemCard
                                key={data.id}
                                data={data}
                                onDetailClick={() => handleOrderDetailClick(data)}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DroppableArea>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
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
