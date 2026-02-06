/**
 * Публичная загрузка коллекций для блока «КОЛЛЕКЦИИ THE ÁME» на главной.
 * Использует anon-клиент. RLS разрешает SELECT только для is_active=true.
 */

import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/supabaseClient";

export type HomeCollection = {
  id: string;
  imageUrl: string;
  name: string;
  categorySlug: string;
  sort_order: number;
};

async function getActiveHomeCollectionsUncached(): Promise<HomeCollection[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  try {
    const { data, error } = await supabase
      .from("home_collections")
      .select("id, image_url, name, category_slug, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true, nullsFirst: false });

    if (error) return [];

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

/** Кэш 5 мин */
export async function getActiveHomeCollections(): Promise<HomeCollection[]> {
  return unstable_cache(getActiveHomeCollectionsUncached, ["home-collections"], { revalidate: 300 })();
}
