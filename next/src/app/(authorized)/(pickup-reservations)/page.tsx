'use client';

import { useState } from 'react';
import PageHeader from "@/components/ui/page-header";
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
    <div className="min-h-screen relative overflow-hidden page-bg-gradient">
      {/* Background decoration */}
      <div className="bg-decoration-top-right" />
      <div className="bg-decoration-bottom-left" />

      {/* Header */}
      <PageHeader title="PEAR System" />

      {/* Main Content */}
      <main className="px-8 py-6">
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
      </main>
    </div>
  )
}
