import type { Metadata, Viewport } from "next";
import { Exo_2, Orbitron } from "next/font/google";
import { RegisterSW } from "@/components/RegisterSW";
import "./globals.css";

const body = Exo_2({ variable: "--font-body", subsets: ["latin"] });
const display = Orbitron({ variable: "--font-display", subsets: ["latin"], weight: ["500", "700", "900"] });

export const metadata: Metadata = {
  title: "Life OS",
  description: "Your personal daily life tracker",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Life OS", statusBarStyle: "black-translucent" },
  icons: { icon: "/icons/icon.svg", apple: "/icons/icon-192.png" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#070512",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="neon">
      <body className={`${body.variable} ${display.variable} font-sans antialiased`}>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
