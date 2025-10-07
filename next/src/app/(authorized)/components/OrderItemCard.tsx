import type { GetOrderListApiResponseContent } from '@/types/order';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function OrderItemCard({data}: {data: GetOrderListApiResponseContent | GetOrderListApiResponseContent<null>}) {
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
      {...listeners}
      className="rounded-sm border border-gray-600 text-base p-1 cursor-pointer"
    >
      <div className="flex flex-col space-y-4">
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
    </div>
  )
}