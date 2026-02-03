/**
 * Страницы каталога (catalog_pages): Каталог (/magazin), Все цветы (/posmotret-vse-tsvety).
 * Публичное чтение — только активные, для витрины.
 */

import { supabase } from "@/lib/supabaseClient";

export type CatalogPage = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
};

export async function getActiveCatalogPages(): Promise<CatalogPage[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  try {
    const { data, error } = await supabase
      .from("catalog_pages")
      .select("id, slug, title, description, sort_order, is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true, nullsFirst: false });

    if (error) {
      if (error.code === "42P01") return [];
      console.warn("[catalogPages] Ошибка загрузки:", error.message);
      return [];
    }

    return (data ?? []).map((r) => ({
      id: String(r.id),
      slug: r.slug ?? "",
      title: r.title ?? "",
      description: r.description ?? null,
      sort_order: r.sort_order ?? 0,
      is_active: r.is_active ?? true,
    }));
  } catch {
    return [];
  }
}
