/**
 * Публичная загрузка коллекций для блока «КОЛЛЕКЦИИ THE ÁME» на главной.
 * Использует anon-клиент. RLS разрешает SELECT только для is_active=true.
 */

import { supabase } from "@/lib/supabaseClient";

export type HomeCollection = {
  id: string;
  imageUrl: string;
  name: string;
  categorySlug: string;
  sort_order: number;
};

export async function getActiveHomeCollections(): Promise<HomeCollection[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  try {
    const { data, error } = await supabase
      .from("home_collections")
      .select("id, image_url, name, category_slug, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true, nullsFirst: false });

    if (error) {
      if (error.code === "42P01") return []; // таблица не существует
      console.warn("[homeCollections] Ошибка загрузки:", error.message);
      return [];
    }

    return (data ?? []).map((r) => ({
      id: String(r.id),
      imageUrl: r.image_url ?? "",
      name: r.name ?? "",
      categorySlug: r.category_slug ?? "magazin",
      sort_order: r.sort_order ?? 0,
    }));
  } catch {
    return [];
  }
}
