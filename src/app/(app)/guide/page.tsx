import type { Metadata } from "next";
import { Guide } from "@/components/views/guide";

export const metadata: Metadata = { title: "How it works" };

export default function Page() {
  return <Guide />;
}
