import type { Metadata } from "next";
import { Bills } from "@/components/views/bills";

export const metadata: Metadata = { title: "Bills" };

export default function Page() {
  return <Bills />;
}
