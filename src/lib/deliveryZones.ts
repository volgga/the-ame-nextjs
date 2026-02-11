/**
 * Публичная загрузка зон доставки (источник истины — Supabase delivery_zones).
 * Используется: страница «Доставка и оплата», API /api/delivery-zones (для корзины).
 */

import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/supabaseClient";
import type { DeliveryZone } from "@/types/delivery";

type DbRow = {
  id: string;
  zone_title: string;
  paid_up_to: number;
  delivery_price: number;
  free_from: number;
  subareas_text: string | null;
  sort_order: number;
};

function mapRowToZone(row: DbRow): DeliveryZone {
  return {
    id: String(row.id),
    title: row.zone_title,
    price: row.delivery_price,
    conditions: row.subareas_text ?? null,
    freeFrom: row.free_from,
    paidUpTo: row.paid_up_to,
    sortOrder: row.sort_order,
  };
}

async function getDeliveryZonesUncached(): Promise<DeliveryZone[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  try {
    const { data, error } = await supabase
      .from("delivery_zones")
      .select("id, zone_title, paid_up_to, delivery_price, free_from, subareas_text, sort_order")
      .order("sort_order", { ascending: true });

    if (error) {
      if (error.code === "42P01" || error.code === "PGRST116") return [];
      console.warn("[deliveryZones] Ошибка загрузки:", error.message);
      return [];
    }

    if (!data || !Array.isArray(data) || data.length === 0) return [];

    const valid = data.filter(
      (row: unknown): row is DbRow =>
        typeof row === "object" &&
        row !== null &&
        "id" in row &&
        "zone_title" in row &&
        "paid_up_to" in row &&
        "delivery_price" in row &&
        "free_from" in row &&
        "sort_order" in row &&
        typeof (row as DbRow).zone_title === "string" &&
        typeof (row as DbRow).paid_up_to === "number" &&
        typeof (row as DbRow).delivery_price === "number" &&
        typeof (row as DbRow).free_from === "number"
    );

    return valid.map(mapRowToZone);
  } catch {
    return [];
  }
}

export async function getDeliveryZones(): Promise<DeliveryZone[]> {
  return unstable_cache(getDeliveryZonesUncached, ["delivery-zones"], {
    revalidate: 300,
    tags: ["delivery-zones"],
  })();
}
