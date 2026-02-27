import { Calendar, ClipboardList, Truck, LucideIcon } from 'lucide-react';

export interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
}

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'pickup-reservations',
    label: '受取予約',
    href: '/',
    icon: Calendar,
  },
  {
    id: 'prep-board',
    label: '準備ボード',
    href: '/prep-board',
    icon: ClipboardList,
  },
  {
    id: 'shipment-record',
    label: '出荷記録',
    href: '/shipment-record',
    icon: Truck,
  },
];
