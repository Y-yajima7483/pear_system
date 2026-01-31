'use client';

import { useState } from 'react';
import OrderRegisterDialog from "../components/OrderRegisterDialog";
import OrderItemFortnightCalendar from "@/app/(authorized)/components/OrderItemFortnightCalendar";
import DateNavigation from "../components/DateNavigation";

export default function PickupReservationsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [baseDate, setBaseDate] = useState(new Date());

  const handleOrderCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleDateChange = (newDate: Date) => {
    setBaseDate(newDate);
  };

  return (
    <div className="px-6 py-6 md:px-8">
      {/* Week Navigation */}
      <div className="mb-5">
        <DateNavigation
          currentDate={baseDate}
          onDateChange={handleDateChange}
          actionButton={<OrderRegisterDialog onOrderCreated={handleOrderCreated} />}
        />
      </div>

      {/* Calendar */}
      <OrderItemFortnightCalendar refreshKey={refreshKey} baseDate={baseDate} />
    </div>
  )
}
