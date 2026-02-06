import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { VerificationGate } from "@/components/auth/VerificationGate";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zia • SMAN 1 Kotabunan",
  description: "Platform arsip pembelajaran cerdas untuk siswa SMAN 1 Kotabunan. Simpan catatan, rekam materi, dan belajar dengan AI.",
  manifest: "/manifest.json",
  keywords: ["SMAN 1 Kotabunan", "Zia", "Belajar Pintar", "Arsip Siswa", "AI Assistant"],
  authors: [{ name: "Zia Team" }],
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://zia.sman1kotabunan.sch.id",
    title: "Zia • SMAN 1 Kotabunan",
    description: "Pendamping belajar cerdas siswa SMAN 1 Kotabunan.",
    siteName: "Zia",
    images: [{
      url: "/image/logo sman 1 kotabunan.webp",
      width: 1200,
      height: 630,
      alt: "Zia SMAN 1 Kotabunan"
    }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Zia • SMAN 1 Kotabunan",
    description: "Pendamping belajar cerdas siswa SMAN 1 Kotabunan.",
    images: ["/image/logo sman 1 kotabunan.webp"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#ec4899",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <OfflineIndicator />
        <VerificationGate>
          {children}
        </VerificationGate>
        <Toaster />
      </body>
    </html>
  );
}
