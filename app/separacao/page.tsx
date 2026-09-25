import { Suspense } from "react";
import WarehouseScreen from "@/components/warehouse";

export default function Page() {
  return <Suspense fallback={<main className="min-h-screen bg-background" />}><WarehouseScreen /></Suspense>;
}
