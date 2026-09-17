import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { PwaProvider } from "@/components/pwa/pwa-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "LearnTrack — Deliberate Learning & Spaced Revision System",
  description:
    "A dedicated learning self-tracking web application: 45-minute focus blocks, reflective logs, and automated 4-stage spaced revisions.",
  manifest: "/manifest.json",
  applicationName: "LearnTrack",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LearnTrack",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <PwaProvider>{children}</PwaProvider>
      </body>
    </html>
  );
}
