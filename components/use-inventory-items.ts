"use client";

import { useMemo, useSyncExternalStore } from "react";
import { getInventoryItems, subscribeToInventory } from "@/lib/inventory-storage";
import { stock } from "@/lib/mock-data";

const getSnapshot = () => window.localStorage.getItem("cellarium-inventory-state") ?? "";
const getServerSnapshot = () => "";

export function useInventoryItems() {
  const snapshot = useSyncExternalStore(subscribeToInventory, getSnapshot, getServerSnapshot);
  return useMemo(() => snapshot ? getInventoryItems() : stock, [snapshot]);
}
