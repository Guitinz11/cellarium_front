import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui";
import WarehouseScreen from "@/components/warehouse";

export default function Page() {
  return <Suspense fallback={<PageSkeleton/>}><WarehouseScreen/></Suspense>;
}