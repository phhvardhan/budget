import type { Metadata } from "next";
import { Year } from "@/components/views/year";

export const metadata: Metadata = { title: "Year" };

export default function Page() {
  return <Year />;
}
