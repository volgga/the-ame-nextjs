/**
 * variant_products + product_variants: загрузка из Supabase.
 * Один клиент — @/lib/supabaseClient.
 * Формат как Product (id, slug, title, price, image, shortDescription) для единого каталога.
 */

import { supabase } from "@/lib/supabaseClient";
import type { Product } from "@/lib/products";

const VP_ID_PREFIX = "vp-";
const LOG_PREFIX = "[variantProducts/Supabase]";

type VariantProductsRow = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  min_price_cache: number | null;
  is_active: boolean;
  is_hidden: boolean | null;
  published_at: string | null;
  sort_order: number;
};

function rowToProduct(row: VariantProductsRow): Product {
  return {
    id: VP_ID_PREFIX + String(row.id),
    slug: row.slug ?? "",
    title: row.name ?? "",
    price: Number(row.min_price_cache) ?? 0,
    image: row.image_url ?? "",
    shortDescription: row.description ?? "",
  };
}

/**
 * Все видимые variant_products (is_active не false, is_hidden не true, published_at не фильтруем — показываем все).
 */
export async function getAllVariantProducts(): Promise<Product[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  try {
    const { data, error } = await supabase
      .from("variant_products")
      .select("id, slug, name, description, image_url, min_price_cache, is_active, is_hidden, published_at, sort_order")
      .or("is_active.eq.true,is_active.is.null")
      .or("is_hidden.eq.false,is_hidden.is.null")
      .order("sort_order", { ascending: true, nullsFirst: false });

    if (error) {
      console.error(`${LOG_PREFIX} Ошибка загрузки variant_products:`, error.message, error.code);
      return [];
    }
    if (!data?.length) return [];
    return data.map((r) => rowToProduct(r as VariantProductsRow));
  } catch (e) {
    console.error(`${LOG_PREFIX} Исключение:`, e instanceof Error ? e.message : String(e));
    return [];
  }
}

/**
 * Один variant_product по slug.
 */
export async function getVariantProductBySlug(slug: string): Promise<Product | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  try {
    const { data, error } = await supabase
      .from("variant_products")
      .select("id, slug, name, description, image_url, min_price_cache, is_active, is_hidden, published_at, sort_order")
      .eq("slug", slug)
      .or("is_active.eq.true,is_active.is.null")
      .or("is_hidden.eq.false,is_hidden.is.null")
      .maybeSingle();

    if (error || !data) return null;
    return rowToProduct(data as VariantProductsRow);
  } catch (e) {
    console.error(`${LOG_PREFIX} getVariantProductBySlug:`, e instanceof Error ? e.message : String(e));
    return null;
  }
}

/** Является ли id из variant_products (vp-123). */
export function isVariantProductId(id: string): boolean {
  return id.startsWith(VP_ID_PREFIX);
}
