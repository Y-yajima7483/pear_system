'use client';

import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Button from "@/components/ui/Button";
import type { GetOrderListApiResponseContent } from '@/types/order';
import { orderItemStatus } from '@/types/order';
import { getOrderItemStatusLabelAndClass } from '@/lib/utils';
import usePatchApi from '@/lib/api/usePatchApi';
import { commonApiHookOptions } from '@/lib/api/commonErrorHandlers';

interface OrderDetailDialogProps {
  order: GetOrderListApiResponseContent | GetOrderListApiResponseContent<null> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditClick?: () => void;
  onStatusChanged?: () => void;
}

export default function OrderDetailDialog({ order, open, onOpenChange, onEditClick, onStatusChanged }: OrderDetailDialogProps) {
  const { patch, loading: patchLoading } = usePatchApi<{ status: string }>(commonApiHookOptions);

  if (!order) return null;

  const pickupDateFormatted = order.pickup_date
    ? format(new Date(order.pickup_date), 'yyyy年MM月dd日(E)', { locale: ja })
    : '未定';

  const { label: statusLabel, className: statusClassName } = getOrderItemStatusLabelAndClass(order.status);

  const handlePickedUp = async () => {
    const result = await patch(`/order/${order.id}/status`, { status: orderItemStatus.PICKED_UP });
    if (result.success) {
      onOpenChange(false);
      onStatusChanged?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[70vh] overflow-y-scroll p-0 max-w-xl"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="sticky top-0 z-2 bg-background w-full p-4">
          <DialogTitle>注文詳細</DialogTitle>
          <DialogDescription>
            注文ID: {order.id}
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 pb-4 space-y-6">
          {/* お客様情報 */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-500">お客様情報</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex items-start">
                  <span className="text-sm font-medium text-gray-700 min-w-[100px]">お客様名</span>
                  <span className="text-sm text-gray-900">{order.customer_name}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 受取情報 */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-500">受取情報</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex items-start">
                  <span className="text-sm font-medium text-gray-700 min-w-[100px]">受取日</span>
                  <span className="text-sm text-gray-900">{pickupDateFormatted}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700 min-w-[100px]">ステータス</span>
                  <div className="w-full flex items-center justify-between">
                    <span className={`pear-badge ${statusClassName}`}>
                      {statusLabel}
                    </span>
                    {order.status === orderItemStatus.PENDING && (
                      <Button
                        type="button"
                        color="info"
                        onClick={handlePickedUp}
                        disabled={patchLoading}
                        className="ml-2 text-xs"
                      >
                        受取完了
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 注文商品 */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-500">注文商品</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div
                    key={`${order.id}-${index}-${item.item}`}
                    className="flex justify-between items-center py-2 border-b last:border-b-0 border-gray-200"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.item}</p>
                      {item.variety && (
                        <p className="text-xs text-gray-500 mt-0.5">{item.variety}</p>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-gray-900 ml-4">
                      × {item.quantity}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="sticky bottom-0 z-10 bg-background w-full p-4 border-t">
          <DialogClose asChild>
            <Button type="button" outline className='w-full'>閉じる</Button>
          </DialogClose>
          {onEditClick && (
            <Button type="button" onClick={onEditClick} className='w-full'>
              編集
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
