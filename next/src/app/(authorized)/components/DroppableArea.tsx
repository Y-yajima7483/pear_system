import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface DroppableAreaProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export default function DroppableArea({ id, children, className = '' }: DroppableAreaProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div 
      ref={setNodeRef} 
      className={`${className} ${isOver ? 'bg-gray-100' : ''}`}
    >
      {children}
    </div>
  );
}