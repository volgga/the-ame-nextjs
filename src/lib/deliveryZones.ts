/**
 * Публичная загрузка зон доставки для страницы "Доставка и оплата".
 */

import { supabase } from "@/lib/supabaseClient";

export type DeliveryZone = {
  id: string;
  zone_title: string;
  paid_up_to: number;
  delivery_price: number;
  free_from: number;
  subareas_text: string | null;
  sort_order: number;
};

const DEFAULT_ZONES: DeliveryZone[] = [
  { id: "1", zone_title: "Центр Сочи", paid_up_to: 4000, delivery_price: 300, free_from: 4000, subareas_text: null, sort_order: 0 },
  { id: "2", zone_title: "Дагомыс, Мацеста", paid_up_to: 5000, delivery_price: 500, free_from: 5000, subareas_text: null, sort_order: 1 },
  { id: "3", zone_title: "Хоста", paid_up_to: 7000, delivery_price: 700, free_from: 7000, subareas_text: null, sort_order: 2 },
  { id: "4", zone_title: "Адлер", paid_up_to: 9000, delivery_price: 900, free_from: 9000, subareas_text: null, sort_order: 3 },
  { id: "5", zone_title: "Сириус, Лоо", paid_up_to: 12000, delivery_price: 1200, free_from: 12000, subareas_text: null, sort_order: 4 },
  { id: "6", zone_title: "п. Красная поляна", paid_up_to: 18000, delivery_price: 1800, free_from: 18000, subareas_text: null, sort_order: 5 },
  { id: "7", zone_title: "п. Эсто-Садок", paid_up_to: 20000, delivery_price: 2000, free_from: 20000, subareas_text: null, sort_order: 6 },
  { id: "8", zone_title: "п. Роза-Хутор", paid_up_to: 22000, delivery_price: 2200, free_from: 22000, subareas_text: null, sort_order: 7 },
  { id: "9", zone_title: "На высоту 960м (Роза-Хутор/Горки город)", paid_up_to: 24000, delivery_price: 2400, free_from: 24000, subareas_text: null, sort_order: 8 },
];

export async function getDeliveryZones(): Promise<DeliveryZone[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return DEFAULT_ZONES;

  try {
    const { data, error } = await supabase
      .from("delivery_zones")
      .select("id, zone_title, paid_up_to, delivery_price, free_from, subareas_text, sort_order")
      .order("sort_order", { ascending: true });

    if (error) {
      if (error.code === "42P01" || error.code === "PGRST116") return DEFAULT_ZONES;
      console.warn("[deliveryZones] Ошибка загрузки:", error.message);
      return DEFAULT_ZONES;
    }

    if (!data || !Array.isArray(data) || data.length === 0) return DEFAULT_ZONES;

    const valid = data.filter(
      (row: unknown): row is DeliveryZone =>
        typeof row === "object" &&
        row !== null &&
        "id" in row &&
        "zone_title" in row &&
        "paid_up_to" in row &&
        "delivery_price" in row &&
        "free_from" in row &&
        "sort_order" in row &&
        typeof (row as { zone_title: unknown }).zone_title === "string" &&
        typeof (row as { paid_up_to: unknown }).paid_up_to === "number" &&
        typeof (row as { delivery_price: unknown }).delivery_price === "number" &&
        typeof (row as { free_from: unknown }).free_from === "number"
    );

    return valid.length > 0 ? valid : DEFAULT_ZONES;
  } catch {
    return DEFAULT_ZONES;
  }
}
