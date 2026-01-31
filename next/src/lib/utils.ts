import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { orderItemStatus, type OrderItemStatusType } from "@/types/order"
import type { ApiOptionType } from "@/types/index"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ステータス定義（ラベルとクラス名を一元管理）
const orderItemStatusConfig: Record<OrderItemStatusType, { label: string; className: string }> = {
  [orderItemStatus.PENDING]: { label: '未受取', className: 'pending' },
  [orderItemStatus.PICKED_UP]: { label: '受取済', className: 'recieved' },
  [orderItemStatus.CANCELED]: { label: 'キャンセル', className: 'canceled' },
} as const;

export function getOrderItemStatusLabelAndClass(status: OrderItemStatusType) {
  return orderItemStatusConfig[status] ?? { label: '未受取', className: '' };
}

// SelectBox用のステータスオプション配列
export const orderItemStatusOptions: ApiOptionType[] = Object.entries(orderItemStatusConfig).map(
  ([value, { label }]) => ({ label, value: Number(value) })
);