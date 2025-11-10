import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "受取予約 - PEAR System",
  description: "梨の受取予約とスケジュール管理",
};

export default function PickupReservationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
