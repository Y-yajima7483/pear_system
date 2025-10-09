'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation';
import { addDays, startOfWeek, format, subWeeks, isToday } from 'date-fns';
import useGetApi from '@/lib/api/useGetApi'
import usePutApi from '@/lib/api/usePutApi';
import { ja } from 'date-fns/locale';
import { overlayStore } from '@/stores/useOverlayStore';
import type { GetOrderListApiResponse, GetOrderListApiResponseContent } from '@/types/order';
import { commonApiHookOptions } from '@/lib/api/commonErrorHandlers';
import OrderItemCard from './OrderItemCard';
import OrderDetailDialog from './OrderDetailDialog';
import DroppableArea from './DroppableArea';
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
}

export default function OrderItemFortnightCalendar({ refreshKey = 0 }: OrderItemFortnightCalendarProps) {
  const router = useRouter();
  const { openOverlay, closeOverlay } = overlayStore();
  const {update, loading} = usePutApi(commonApiHookOptions);
  const { get: getOrderList } = useGetApi<GetOrderListApiResponse>(commonApiHookOptions);
  const baseDate = new Date()
  const weekStartsOn: TwoWeekCalendarProps['weekStartsOn'] = 1
  // 現在の日付の2週間前から開始
  const startDate = subWeeks(baseDate, 2)
  const weekStart = startOfWeek(startDate, { weekStartsOn, locale: ja })
  // 4週間分（28日）の日付配列を生成
  const days = Array.from({ length: 28 }, (_, i) => addDays(weekStart, i))
  const minInnerWidth = 10 + 28 * 350;
  const [orderData, setOrderData] = useState<{[key: string]:Array<GetOrderListApiResponseContent>}>({});
  const [unreservedData, setUnreservedData] = useState<Array<GetOrderListApiResponseContent<null>>>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<GetOrderListApiResponseContent | GetOrderListApiResponseContent<null> | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [hasInitialScroll, setHasInitialScroll] = useState(false);
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
      openOverlay();
      const res = await getOrderList('/order', {
        params: {
          target_date: format(baseDate, 'yyyy-MM-dd')
        }
      });
      if(res.success) {
        setUnreservedData(res.data.unreserved_data);
        // pickup_dateで注文データをグルーピング
        const groupedData = res.data.reserved_data.reduce((acc: {[key: string]: Array<GetOrderListApiResponseContent>}, order) => {
          const dateKey = order.pickup_date;
          if (!acc[dateKey]) {
            acc[dateKey] = [];
          }
          acc[dateKey].push(order);
          return acc;
        }, {});
        
        setOrderData(groupedData);
      }
    } finally {
      closeOverlay();
    }
  };
  
  useEffect(()=> {
    fetchOrderData();
  },[refreshKey])

  // 初期表示時に現在の日付までスクロール（一度だけ実行）
  useEffect(() => {
    if (calendarScrollRef.current && !hasInitialScroll) {
      // 現在日付のインデックスを取得
      const todayIndex = days.findIndex(day => isToday(day));
      if (todayIndex >= 0) {
        // 各列の幅（350px）と余白を考慮してスクロール位置を計算
        // 現在日付を中央付近に表示するため、少し調整
        const scrollPosition = Math.max(0, (todayIndex-1) * 350);
        calendarScrollRef.current.scrollLeft = scrollPosition;
        setHasInitialScroll(true);
      }
    }
  }, [days, hasInitialScroll]);
  
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
              <div className="h-full grid [grid-template-columns:10px_repeat(28,minmax(250px,1fr))]">
                <div className="h-12 sticky top-0 z-10" />
                {days.map((d, idx) => {
                  const dateKey = format(d, 'yyyy-MM-dd');
                  const dateItems = orderData?.[dateKey] || [];
                  const isCurrentDate = isToday(d);
                  return (
                    <div key={`hdr-${idx}`} className="flex flex-wrap h-full">
                      <div
                        className={`w-full h-12 border-b border-l border-gray-900 px-3 flex items-center text-sm font-medium ${
                          isCurrentDate ? 'bg-blue-50 text-blue-900 font-bold' : 'bg-white'
                        }`}
                      >
                        {formatDayLabel(d)}
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
      />
    </DndContext>
  )
}
