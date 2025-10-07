'use client';

import { useState } from 'react';
import OrderRegisterDialog from "../components/OrderRegisterDialog";
import OrderItemFortnightCalendar from "@/app/(authorized)/components/OrderItemFortnightCalendar";

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);
  
  const handleOrderCreated = () => {
    setRefreshKey(prev => prev + 1);
  };
  
  return (
    <>
      <div className="w-full border-b border-border-default py-4 pl-2">
        <OrderRegisterDialog onOrderCreated={handleOrderCreated} />
      </div>
      <OrderItemFortnightCalendar refreshKey={refreshKey} />
    </>
  )
}