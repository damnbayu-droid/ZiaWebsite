import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { VerificationGate } from "@/components/auth/VerificationGate";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zia - Learning Archive",
  description: "Private learning platform for high school students",
  manifest: "/manifest.json",
  robots: {
    index: false,
    follow: false,
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
