import { Suspense } from "react";
import WarehouseScreen from "@/components/warehouse";

export default function Page() {
  return <Suspense fallback={<main className="min-h-screen bg-[#F4F7FB]" />}><WarehouseScreen /></Suspense>;
}
