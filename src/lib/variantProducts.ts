/**
 * variant_products + product_variants: загрузка из Supabase.
 * Один клиент — @/lib/supabaseClient.
 * Формат как Product (id, slug, title, price, image, shortDescription) для единого каталога.
 */

import { supabase } from "@/lib/supabaseClient";
import type { Product } from "@/lib/products";
import { getCategories } from "@/lib/categories";

const VP_ID_PREFIX = "vp-";
const LOG_PREFIX = "[variantProducts/Supabase]";

type VariantProductsRow = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  composition?: string | null;
  height_cm?: number | null;
  width_cm?: number | null;
  image_url: string | null;
  min_price_cache: number | null;
  category_slug?: string | null;
  category_slugs?: string[] | null;
  is_active: boolean;
  is_hidden: boolean | null;
  published_at: string | null;
  sort_order: number;
  created_at?: string | null; // опционально, если есть в БД
};

export type ProductVariantPublic = {
  id: number;
  name: string;
  price: number;
  composition?: string | null;
  height_cm?: number | null;
  width_cm?: number | null;
  image_url?: string | null;
};

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
      .select(
        "id, slug, name, description, image_url, min_price_cache, category_slug, category_slugs, is_active, is_hidden, published_at, sort_order"
      )
      .or("is_active.eq.true,is_active.is.null")
      .or("is_hidden.eq.false,is_hidden.is.null")
      .order("sort_order", { ascending: true, nullsFirst: false });

    if (error) {
      console.error("[getAllVariantProducts] Supabase error:", error.message, "code:", error.code);
      return [];
    }
    if (!data?.length) return [];

    // Загружаем все категории один раз для кэширования
    const allCategories = await getCategories();
    const categoryMap = new Map(allCategories.map((c) => [c.slug, c.name]));
    
    // Создаем кэш для преобразования слогов в названия
    const categoryNamesCache = new Map<string, string[]>();
    const getCategoryNames = (slugs: string[]): string[] => {
      const cacheKey = slugs.sort().join(",");
      if (!categoryNamesCache.has(cacheKey)) {
        const names = slugs
          .map((slug) => categoryMap.get(slug))
          .filter((name): name is string => Boolean(name));
        categoryNamesCache.set(cacheKey, names);
      }
      return categoryNamesCache.get(cacheKey)!;
    };

    // Преобразуем все строки в Product с категориями
    return Promise.all(
      data.map(async (r) => {
        const row = r as VariantProductsRow;
        const categorySlugs: string[] = [];
        if (row.category_slugs && Array.isArray(row.category_slugs)) {
          categorySlugs.push(...row.category_slugs);
        }
        if (row.category_slug && !categorySlugs.includes(row.category_slug)) {
          categorySlugs.push(row.category_slug);
        }
        
        const categories = categorySlugs.length > 0 ? getCategoryNames(categorySlugs) : undefined;
        
        return {
          id: VP_ID_PREFIX + String(row.id),
          slug: row.slug ?? "",
          title: row.name ?? "",
          price: Number(row.min_price_cache) ?? 0,
          image: row.image_url ?? "",
          shortDescription: row.description ?? "",
          composition: null,
          sizeHeightCm: null,
          sizeWidthCm: null,
          categorySlug: row.category_slug ?? null,
          categorySlugs: categorySlugs.length > 0 ? categorySlugs : null,
          categories: categories && categories.length > 0 ? categories : undefined,
          sortOrder: row.sort_order ?? 0,
          createdAt: row.created_at ?? undefined, // fallback для вторичной сортировки
        } satisfies Product;
      })
    );
  } catch (e) {
    console.error("[getAllVariantProducts]", e instanceof Error ? e.message : String(e));
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
      .select(
        "id, slug, name, description, image_url, min_price_cache, category_slug, category_slugs, is_active, is_hidden, published_at, sort_order"
      )
      .eq("slug", slug)
      .or("is_active.eq.true,is_active.is.null")
      .or("is_hidden.eq.false,is_hidden.is.null")
      .maybeSingle();

    if (error || !data) return null;
    
    // Загружаем категории для преобразования
    const allCategories = await getCategories();
    const categoryMap = new Map(allCategories.map((c) => [c.slug, c.name]));
    const row = data as VariantProductsRow;
    const categorySlugs: string[] = [];
    if (row.category_slugs && Array.isArray(row.category_slugs)) {
      categorySlugs.push(...row.category_slugs);
    }
    if (row.category_slug && !categorySlugs.includes(row.category_slug)) {
      categorySlugs.push(row.category_slug);
    }
    const categories = categorySlugs.length > 0
      ? categorySlugs.map((slug) => categoryMap.get(slug)).filter((name): name is string => Boolean(name))
      : undefined;
    
    return {
      id: VP_ID_PREFIX + String(row.id),
      slug: row.slug ?? "",
      title: row.name ?? "",
      price: Number(row.min_price_cache) ?? 0,
      image: row.image_url ?? "",
      shortDescription: row.description ?? "",
      composition: null,
      sizeHeightCm: null,
      sizeWidthCm: null,
      categorySlug: row.category_slug ?? null,
      categorySlugs: categorySlugs.length > 0 ? categorySlugs : null,
      categories: categories && categories.length > 0 ? categories : undefined,
    };
  } catch (e) {
    console.error(`${LOG_PREFIX} getVariantProductBySlug:`, e instanceof Error ? e.message : String(e));
    return null;
  }
}

/**
 * Вариантный товар по slug с массивом вариантов (для витрины: состав/размер выбранного варианта).
 */
export async function getVariantProductWithVariantsBySlug(
  slug: string
): Promise<(Product & { variants?: ProductVariantPublic[] }) | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  try {
    const { data: vp, error: vpErr } = await supabase
      .from("variant_products")
      .select(
        "id, slug, name, description, image_url, min_price_cache, category_slug, category_slugs, is_active, is_hidden, published_at, sort_order"
      )
      .eq("slug", slug)
      .or("is_active.eq.true,is_active.is.null")
      .or("is_hidden.eq.false,is_hidden.is.null")
      .maybeSingle();

    if (vpErr || !vp) return null;
    
    // Загружаем категории для преобразования
    const allCategories = await getCategories();
    const categoryMap = new Map(allCategories.map((c) => [c.slug, c.name]));
    const row = vp as VariantProductsRow;
    const categorySlugs: string[] = [];
    if (row.category_slugs && Array.isArray(row.category_slugs)) {
      categorySlugs.push(...row.category_slugs);
    }
    if (row.category_slug && !categorySlugs.includes(row.category_slug)) {
      categorySlugs.push(row.category_slug);
    }
    const categories = categorySlugs.length > 0
      ? categorySlugs.map((slug) => categoryMap.get(slug)).filter((name): name is string => Boolean(name))
      : undefined;
    
    const product: Product = {
      id: VP_ID_PREFIX + String(row.id),
      slug: row.slug ?? "",
      title: row.name ?? "",
      price: Number(row.min_price_cache) ?? 0,
      image: row.image_url ?? "",
      shortDescription: row.description ?? "",
      composition: null,
      sizeHeightCm: null,
      sizeWidthCm: null,
      categorySlug: row.category_slug ?? null,
      categories: categories && categories.length > 0 ? categories : undefined,
    };

    const { data: vars, error: vErr } = await supabase
      .from("product_variants")
      .select("id, title, composition, height_cm, width_cm, price, image_url")
      .eq("product_id", (vp as { id: number }).id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true, nullsFirst: false });

    if (vErr || !vars?.length) return product;
    const variants: ProductVariantPublic[] = vars.map(
      (v: {
        id: number;
        title?: string;
        composition?: string | null;
        height_cm?: number | null;
        width_cm?: number | null;
        price?: number;
        image_url?: string | null;
      }) => ({
        id: v.id,
        name: v.title ?? "",
        price: Number(v.price ?? 0),
        composition: v.composition?.trim() || null,
        height_cm: v.height_cm != null ? Number(v.height_cm) : null,
        width_cm: v.width_cm != null ? Number(v.width_cm) : null,
        image_url: v.image_url ?? null,
      })
    );
    return { ...product, variants };
  } catch (e) {
    console.error(`${LOG_PREFIX} getVariantProductWithVariantsBySlug:`, e instanceof Error ? e.message : String(e));
    return null;
  }
}

/** Является ли id из variant_products (vp-123). */
export function isVariantProductId(id: string): boolean {
  return id.startsWith(VP_ID_PREFIX);
}
