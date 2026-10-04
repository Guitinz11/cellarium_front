"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { listStock, type ApiStockItem } from "@/lib/warehouse-api";

export type InventoryItem = {
  name: string;
  code: string;
  quantity: number;
  minimum: number;
  unit: string;
  category: string;
  specification: string;
};

function toInventoryItem(item: ApiStockItem): InventoryItem {
  return {
    name: item.material,
    code: item.codigo,
    quantity: item.estoque_atual,
    minimum: item.estoque_minimo,
    unit: item.unidade,
    category: item.categoria,
    specification: "",
  };
}

export function useInventoryItems() {
  const [items, setItems] = useState<InventoryItem[]>([]);

  const loadItems = useEffectEvent(async () => {
    try {
      const result = await listStock({ limit: 100 });
      setItems(result.dados.map(toInventoryItem));
    } catch {
      setItems([]);
    }
  });

  useEffect(() => {
    const timer = window.setTimeout(() => void loadItems(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  return items;
}
