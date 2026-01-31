import type { Metadata } from "next";
import Sidebar from "@/components/ui/Sidebar";

export const metadata: Metadata = {
  title: "PEAR System",
  description: "梨の注文管理システム",
};

export default function AuthorizedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen relative overflow-hidden page-bg-gradient">
      {/* Background decoration */}
      <div className="bg-decoration-top-right" />
      <div className="bg-decoration-bottom-left" />
      {/* Sidebar */}
      <Sidebar />
      {/* Main Content */}
      <main className="with-sidebar min-h-screen">
        {children}
      </main>
    </div>
  )
}
