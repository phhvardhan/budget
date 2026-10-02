import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Backdrop } from "@/components/ui/backdrop";

/** One family from one foundry: Instrument Serif for figures and titles, Instrument Sans for everything you read or tap. */
const sans = Instrument_Sans({ subsets: ["latin"], axes: ["wdth"], variable: "--font-sans-face", display: "swap" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", variable: "--font-serif-face", display: "swap" });

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
    <html lang="en" className={`${sans.variable} ${serif.variable} h-full`}>
      <body className="min-h-full overflow-x-hidden">
        <Backdrop />
        {children}
      </body>
    </html>
  );
}
