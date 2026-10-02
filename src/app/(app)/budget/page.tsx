import type { Metadata } from "next";
import { Budget } from "@/components/views/budget";

export const metadata: Metadata = { title: "Budget" };

export default function Page() {
  return <Budget />;
}
