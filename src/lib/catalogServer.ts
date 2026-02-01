/**
 * Серверная загрузка товаров по id для пересчёта суммы заказа.
 * Цены берутся только из каталога (products + variant_products).
 */

import { createClient } from "@supabase/supabase-js";

const VP_ID_PREFIX = "vp-";

export type CatalogProductInfo = { id: string; name: string; price: number };

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Получить товар по id: из products (uuid) или variant_products (vp-123).
 */
export async function getCatalogProductById(id: string): Promise<CatalogProductInfo | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  if (id.startsWith(VP_ID_PREFIX)) {
    const numId = id.slice(VP_ID_PREFIX.length);
    const n = parseInt(numId, 10);
    if (Number.isNaN(n)) return null;
    const { data, error } = await supabase
      .from("variant_products")
      .select("id, name, min_price_cache")
      .eq("id", n)
      .or("is_active.eq.true,is_active.is.null")
      .or("is_hidden.eq.false,is_hidden.is.null")
      .maybeSingle();
    if (error || !data) return null;
    const price = Number((data as { min_price_cache?: number }).min_price_cache) ?? 0;
    return {
      id: VP_ID_PREFIX + String((data as { id: number }).id),
      name: (data as { name: string }).name ?? "",
      price,
    };
  }

  if (UUID_REGEX.test(id)) {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, price")
      .eq("id", id)
      .or("is_active.eq.true,is_active.is.null")
      .or("is_hidden.eq.false,is_hidden.is.null")
      .maybeSingle();
    if (error || !data) return null;
    const row = data as { id: string; name: string; price?: number };
    return {
      id: row.id,
      name: row.name ?? "",
      price: Number(row.price) ?? 0,
    };
  }

  return null;
}

/**
 * Получить цены и названия по списку id. Возвращает только найденные товары.
 */
export async function getCatalogProductsByIds(ids: string[]): Promise<Map<string, CatalogProductInfo>> {
  const map = new Map<string, CatalogProductInfo>();
  await Promise.all(
    ids.map(async (id) => {
      const p = await getCatalogProductById(id);
      if (p) map.set(id, p);
    })
  );
  return map;
}
