import { Suspense } from "react";
import type { Metadata } from "next";
import { Activity } from "@/components/views/activity";

export const metadata: Metadata = { title: "Activity" };

export default function Page() {
  return (
    <Suspense>
      <Activity />
    </Suspense>
  );
}
