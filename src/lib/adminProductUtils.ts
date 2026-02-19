/**
 * Общие утилиты для API админки товаров (variant_products / product_variants).
 * Соответствие БД: product_variants.title — название варианта.
 */

export const VP_PREFIX = "vp-";

export function getVariantProductId(id: string): number | null {
  if (id.startsWith(VP_PREFIX)) {
    const n = parseInt(id.slice(VP_PREFIX.length), 10);
    return Number.isNaN(n) ? null : n;
  }
  const n = parseInt(id, 10);
  return Number.isNaN(n) ? null : n;
}

/** Эффективная цена варианта: при активной скидке — discount_price, иначе price */
function effectiveVariantPrice(r: { price?: number; discount_percent?: number | null; discount_price?: number | null }): number {
  const price = Number(r.price ?? 0);
  const pct = r.discount_percent;
  const dp = r.discount_price;
  if (typeof pct === "number" && pct > 0 && typeof dp === "number" && dp > 0) return dp;
  return price;
}

/** Пересчитать min_price_cache у variant_products по активным вариантам (с учётом скидок) */
export async function recalcMinPrice(
  supabase: ReturnType<(typeof import("@/lib/supabaseAdmin"))["getSupabaseAdmin"]>,
  productId: number
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const { data } = await sb
    .from("product_variants")
    .select("price, discount_percent, discount_price")
    .eq("product_id", productId)
    .eq("is_active", true);
  const prices = (data ?? []).map((r: { price?: number; discount_percent?: number | null; discount_price?: number | null }) => effectiveVariantPrice(r)).filter((p: number) => p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  await sb.from("variant_products").update({ min_price_cache: minPrice }).eq("id", productId);
}
