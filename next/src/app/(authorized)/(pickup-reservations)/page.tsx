'use client';

import { useState } from 'react';
import OrderRegisterDialog from "../components/OrderRegisterDialog";
import OrderItemFortnightCalendar from "@/app/(authorized)/components/OrderItemFortnightCalendar";
import DateNavigation from "../components/DateNavigation";

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [baseDate, setBaseDate] = useState(new Date());

  const handleOrderCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleDateChange = (newDate: Date) => {
    setBaseDate(newDate);
  };

  return (
    <>
      <div className="w-full border-b border-border-default py-4 px-4">
        <div className="flex items-center justify-between gap-4">
          <OrderRegisterDialog onOrderCreated={handleOrderCreated} />
          <DateNavigation currentDate={baseDate} onDateChange={handleDateChange} />
        </div>
      </div>
      <OrderItemFortnightCalendar refreshKey={refreshKey} baseDate={baseDate} />
    </>
  )
}