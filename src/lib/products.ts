/**
 * Товары: загрузка из Supabase (таблица products + variant_products для единого каталога).
 * Один источник данных — клиент из @/lib/supabaseClient.
 */

import { supabase } from "@/lib/supabaseClient";
import { getAllVariantProducts } from "@/lib/variantProducts";
import { slugify } from "@/utils/slugify";

export type Product = {
  id: string;
  slug: string;
  title: string;
  price: number;
  image: string;
  shortDescription: string;
};

/** Сырая строка таблицы products в Supabase */
type ProductsRow = {
  id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  price?: number | null;
  slug?: string | null;
  is_active?: boolean | null;
  is_hidden?: boolean | null;
};

function rowToProduct(row: ProductsRow): Product {
  const slug =
    (row.slug && String(row.slug).trim()) ||
    slugify(row.name) ||
    String(row.id);
  return {
    id: String(row.id),
    slug,
    title: row.name ?? "",
    price: Number(row.price) ?? 0,
    image: row.image_url ?? "",
    shortDescription: row.description ?? "",
  };
}

const LOG_PREFIX = "[products/Supabase]";

/**
 * Получить все активные товары из Supabase (таблица products).
 * При ошибке или пустой таблице логируем и возвращаем [].
 */
export async function getAllProducts(): Promise<Product[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn(
      `${LOG_PREFIX} NEXT_PUBLIC_SUPABASE_URL или NEXT_PUBLIC_SUPABASE_ANON_KEY не заданы.`
    );
    return [];
  }

  try {
    // Показываем все, где не скрыто явно: is_active не false, is_hidden не true
    const { data, error } = await supabase
      .from("products")
      .select("id, name, description, image_url, price, slug, is_active, is_hidden")
      .or("is_active.eq.true,is_active.is.null")
      .or("is_hidden.eq.false,is_hidden.is.null")
      .order("sort_order", { ascending: true, nullsFirst: false });

    if (error) {
      console.error(
        `${LOG_PREFIX} Ошибка при загрузке товаров:`,
        error.message,
        "код:",
        error.code
      );
      if (error.code === "42P01") {
        console.error(`${LOG_PREFIX} Таблица products не найдена.`);
      }
      if (error.code === "42501") {
        console.error(`${LOG_PREFIX} Нет прав доступа (RLS или роль).`);
      }
      return [];
    }

    if (!data || data.length === 0) {
      console.warn(`${LOG_PREFIX} Таблица products пуста или нет активных записей.`);
      return [];
    }

    return data.map((row) => rowToProduct(row as ProductsRow));
  } catch (e) {
    console.error(
      `${LOG_PREFIX} Supabase не отвечает или исключение:`,
      e instanceof Error ? e.message : String(e)
    );
    return [];
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Найти товар по slug (или по id, если slug — валидный UUID).
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn(
      `${LOG_PREFIX} NEXT_PUBLIC_SUPABASE_URL или NEXT_PUBLIC_SUPABASE_ANON_KEY не заданы.`
    );
    return null;
  }

  try {
    const base = supabase
      .from("products")
      .select("id, name, description, image_url, price, slug, is_active, is_hidden")
      .or("is_active.eq.true,is_active.is.null")
      .or("is_hidden.eq.false,is_hidden.is.null");

    const query =
      UUID_REGEX.test(slug)
        ? base.or(`slug.eq.${slug},id.eq.${slug}`)
        : base.eq("slug", slug);

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error(
        `${LOG_PREFIX} Ошибка при загрузке товара по slug "${slug}":`,
        error.message,
        "код:",
        error.code
      );
      if (error.code === "42501") {
        console.error(`${LOG_PREFIX} Нет прав доступа (RLS).`);
      }
      return null;
    }

    if (!data) {
      return null;
    }

    return rowToProduct(data as ProductsRow);
  } catch (e) {
    console.error(
      `${LOG_PREFIX} Supabase не отвечает при getProductBySlug:`,
      e instanceof Error ? e.message : String(e)
    );
    return null;
  }
}

/**
 * Единый каталог: products + variant_products (сначала products, затем варианты).
 */
export async function getAllCatalogProducts(): Promise<Product[]> {
  const [fromProducts, fromVariants] = await Promise.all([
    getAllProducts(),
    getAllVariantProducts(),
  ]);
  return [...fromProducts, ...fromVariants];
}

/**
 * Товар по slug: сначала products, затем variant_products.
 */
export async function getCatalogProductBySlug(slug: string): Promise<Product | null> {
  const fromProducts = await getProductBySlug(slug);
  if (fromProducts) return fromProducts;
  const { getVariantProductBySlug } = await import("@/lib/variantProducts");
  return getVariantProductBySlug(slug);
}
