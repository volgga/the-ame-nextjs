/**
 * Серверная загрузка товаров по id для пересчёта суммы заказа.
 * Цены берутся только из каталога (products + variant_products).
 */

import { createClient } from "@supabase/supabase-js";

const VP_ID_PREFIX = "vp-";

export type CatalogProductInfo = {
  id: string;
  name: string;
  price: number;
  slug?: string;
  /** Название варианта (для вариантных товаров); выводится в TG и в корзине */
  variantTitle?: string;
};

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VARIANT_SEP = "__";

/**
 * Получить товар по id: из products (uuid), variant_products (vp-123) или позиция варианта (vp-123__45).
 */
export async function getCatalogProductById(id: string): Promise<CatalogProductInfo | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  // Позиция с вариантом: vp-123__45 → товар vp-123, вариант 45
  if (id.includes(VARIANT_SEP)) {
    const [productIdPart, variantIdStr] = id.split(VARIANT_SEP);
    if (!productIdPart?.startsWith(VP_ID_PREFIX) || !variantIdStr) return null;
    const productNumId = parseInt(productIdPart.slice(VP_ID_PREFIX.length), 10);
    const variantNumId = parseInt(variantIdStr, 10);
    if (Number.isNaN(productNumId) || Number.isNaN(variantNumId)) return null;

    const { data: vp, error: vpErr } = await supabase
      .from("variant_products")
      .select("id, name, slug")
      .eq("id", productNumId)
      .or("is_active.eq.true,is_active.is.null")
      .or("is_hidden.eq.false,is_hidden.is.null")
      .maybeSingle();
    if (vpErr || !vp) return null;

    const { data: variant, error: vErr } = await supabase
      .from("product_variants")
      .select("id, title, price")
      .eq("product_id", (vp as { id: number }).id)
      .eq("id", variantNumId)
      .eq("is_active", true)
      .maybeSingle();
    if (vErr || !variant) return null;

    const row = variant as { id: number; title?: string; price?: number };
    const slug = (vp as { slug?: string }).slug?.trim() || undefined;
    return {
      id,
      name: (vp as { name: string }).name ?? "",
      price: Number(row.price) ?? 0,
      slug,
      variantTitle: (row.title ?? "").trim() || undefined,
    };
  }

  if (id.startsWith(VP_ID_PREFIX)) {
    const numId = id.slice(VP_ID_PREFIX.length);
    const n = parseInt(numId, 10);
    if (Number.isNaN(n)) return null;
    const { data, error } = await supabase
      .from("variant_products")
      .select("id, name, min_price_cache, slug")
      .eq("id", n)
      .or("is_active.eq.true,is_active.is.null")
      .or("is_hidden.eq.false,is_hidden.is.null")
      .maybeSingle();
    if (error || !data) return null;
    const price = Number((data as { min_price_cache?: number }).min_price_cache) ?? 0;
    const slug = (data as { slug?: string }).slug?.trim() || undefined;
    return {
      id: VP_ID_PREFIX + String((data as { id: number }).id),
      name: (data as { name: string }).name ?? "",
      price,
      slug,
    };
  }

  if (UUID_REGEX.test(id)) {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, price, slug")
      .eq("id", id)
      .or("is_active.eq.true,is_active.is.null")
      .or("is_hidden.eq.false,is_hidden.is.null")
      .maybeSingle();
    if (error || !data) return null;
    const row = data as { id: string; name: string; price?: number; slug?: string };
    const slug = row.slug?.trim() || undefined;
    return {
      id: row.id,
      name: row.name ?? "",
      price: Number(row.price) ?? 0,
      slug,
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
