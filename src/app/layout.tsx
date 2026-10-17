import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { RegisterSW } from "@/components/RegisterSW";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Life OS",
  description: "Your personal daily life tracker",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Life OS", statusBarStyle: "black-translucent" },
  icons: { icon: "/icons/icon.svg", apple: "/icons/icon-192.png" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0b0716",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="neon">
      <body className={`${geistSans.variable} font-sans antialiased`}>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
