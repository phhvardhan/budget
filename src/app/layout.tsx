import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "./globals.css";
import { Backdrop } from "@/components/ui/backdrop";

export const metadata: Metadata = {
  title: { default: "Payday Ledger", template: "%s · Payday Ledger" },
  description: "Give every dollar of your paycheck a job. A calm, private salary and expense tracker.",
  applicationName: "Payday Ledger",
  appleWebApp: { capable: true, title: "Ledger", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0a090d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} h-full`}>
      <body className="min-h-full overflow-x-hidden">
        <Backdrop />
        {children}
      </body>
    </html>
  );
}
