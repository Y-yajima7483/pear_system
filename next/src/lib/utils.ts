import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { orderItemStatus, type OrderItemStatusType } from "@/types/order"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getOrderItemStatusLabelAndClass(status: OrderItemStatusType) {
  switch(status) {
    case orderItemStatus.PENDING:
      return {label: '未受取', className:'pending'}
    case orderItemStatus.PICKED_UP:
      return {label: '受取済', className:'recieved'}
    case orderItemStatus.CANCELED:
      return {label: 'キャンセル', className:'canceled'}
    default:
      return {label: '未受取', className:''}
  }
}