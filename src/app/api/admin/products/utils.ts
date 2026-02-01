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

/** Пересчитать min_price_cache у variant_products по активным вариантам */
export async function recalcMinPrice(
  supabase: ReturnType<typeof import("@/lib/supabaseAdmin")["getSupabaseAdmin"]>,
  productId: number
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const { data } = await sb
    .from("product_variants")
    .select("price")
    .eq("product_id", productId)
    .eq("is_active", true);
  const prices = (data ?? []).map((r: { price?: number }) => Number(r.price ?? 0)).filter((p: number) => p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  await sb.from("variant_products").update({ min_price_cache: minPrice }).eq("id", productId);
}
