import type { GetOrderListApiResponseContent } from '@/types/order';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getOrderItemStatusLabelAndClass } from '@/lib/utils';

interface OrderItemCardProps {
  data: GetOrderListApiResponseContent | GetOrderListApiResponseContent<null>;
  onDetailClick?: () => void;
}

// 商品リストを短縮表示
const formatItems = (items: Array<{ item: string; quantity: number }>) => {
  if (items.length === 1) {
    return `${items[0].item} ×${items[0].quantity}`;
  }
  return `${items[0].item} ×${items[0].quantity} 他${items.length - 1}件`;
};

export default function OrderItemCard({data, onDetailClick}: OrderItemCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: data.id });

  const style = {
    touchAction: 'none',
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  const { label, className } = getOrderItemStatusLabelAndClass(data.status);


  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`order-card ${className}`}
      {...attributes}
    >
      {/* ドラッグ可能エリア */}
      <div
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        {/* Row 1: 名前 + ステータス（横並び） */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm font-bold flex-1 whitespace-nowrap overflow-hidden text-ellipsis pear-text-primary">
            {data.customer_name}
          </span>
          <span className={`pear-badge text-xs ${className}`}>
            {label}
          </span>
        </div>

        {/* Row 2: 商品サマリー */}
        <div className="text-xs whitespace-nowrap overflow-hidden text-ellipsis pear-text-secondary mb-2">
          {formatItems(data.items)}
        </div>
      </div>

      {/* Row 3: 詳細ボタン（下部） */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDetailClick?.();
        }}
        className="order-detail-btn w-full"
      >
        詳細を見る
      </button>
    </div>
  )
}
