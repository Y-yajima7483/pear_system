import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import Overlay from "@/components/ui/overlay";
import PageHeader from "@/components/ui/page-header";
import { defaultMetadata } from "@/types/metadata";
import "./globals.css";

export const metadata: Metadata = {
  title: defaultMetadata.title,
  description: defaultMetadata.description,
  keywords: defaultMetadata.keywords,
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: defaultMetadata.title,
    description: defaultMetadata.description,
    type: 'website',
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary',
    title: defaultMetadata.title,
    description: defaultMetadata.description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className='antialiased'
      >
        <PageHeader title={defaultMetadata.title} />
        <main className="min-h-screen">{children}</main>
        <Toaster position="top-center" richColors closeButton />
        <Overlay />
      </body>
    </html>
  );
}
