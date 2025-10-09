import type { GetOrderListApiResponseContent } from '@/types/order';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Button from '@/components/ui/Button';

interface OrderItemCardProps {
  data: GetOrderListApiResponseContent | GetOrderListApiResponseContent<null>;
  onDetailClick?: () => void;
}

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
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="rounded-sm border border-gray-600 text-base"
    >
      {/* ドラッグ可能エリア */}
      <div
        {...listeners}
        className="flex flex-col space-y-4 p-1 cursor-grab active:cursor-grabbing"
      >
        <div className="font-bold">
          <p>{data.customer_name}</p>
        </div>
        <div className="space-y-2">
          {data.items.map((val, index)=> (
            <div key={`${data.id}-${index}-${val.item}`}>
              <p>{val.item} × {val.quantity}</p>
            </div>
          ))}
        </div>
      </div>

      {/* アクションボタンエリア（ドラッグ不可） */}
      <div className="border-t border-gray-300 p-1 flex gap-1">
        <Button
          type="button"
          color="info"
          onClick={(e) => {
            e.stopPropagation();
            onDetailClick?.();
          }}
          className="flex-1 !text-xs !py-1"
        >
          詳細
        </Button>
      </div>
    </div>
  )
}