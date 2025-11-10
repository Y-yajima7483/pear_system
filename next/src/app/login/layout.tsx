import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ログイン - PEAR System",
  description: "PEAR System へのログイン",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
