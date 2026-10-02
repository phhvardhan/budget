import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { Backdrop } from "@/components/ui/backdrop";

/** Bricolage Grotesque: one variable family for everything. Width and optical size do the work a second typeface would. */
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
  variable: "--font-bricolage",
  display: "swap",
});

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
    <html lang="en" className={`${bricolage.variable} h-full`}>
      <body className="min-h-full overflow-x-hidden">
        <Backdrop />
        {children}
      </body>
    </html>
  );
}
