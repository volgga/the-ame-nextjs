/**
 * Блок «Хотите добавить к заказу?» на карточке товара.
 * Порядок категорий хранится в add_on_products_categories, управляется из админки «Доп товары».
 * Slug берётся только из таблицы categories (источник истины).
 */

import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/supabaseClient";
import { getCategories } from "@/lib/categories";
import { filterProductsByCategorySlug } from "@/lib/catalogCategories";

/** Названия категорий для порядка по умолчанию; slug берётся из БД по имени */
const DEFAULT_ADD_ON_CATEGORY_NAMES = ["Сладости", "Вазы", "Шары", "Игрушки"] as const;

/**
 * Загружает порядок категорий для блока «Хотите добавить к заказу?».
 * Slug только из таблицы categories. Сохранённые slug, которых нет в categories, отфильтровываются.
 * При пустой таблице возвращается порядок по умолчанию: slug категорий с именами Сладости, Вазы, Шары, Игрушки (из БД).
 */
async function getAddOnCategoriesOrderUncached(): Promise<string[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  let categories: Awaited<ReturnType<typeof getCategories>>;
  try {
    categories = await getCategories();
  } catch {
    return [];
  }

  const validSlugs = new Set(categories.map((c) => c.slug));

  try {
    const { data, error } = await supabase
      .from("add_on_products_categories")
      .select("category_slug, sort_order")
      .order("sort_order", { ascending: true, nullsFirst: false });

    if (!error && data?.length) {
      const order = data
        .map((r) => String(r.category_slug ?? "").trim())
        .filter((slug) => Boolean(slug) && validSlugs.has(slug));
      if (order.length > 0) return order;
    }
  } catch {
    // fallback to default order by names
  }

  const slugByName = new Map(categories.map((c) => [c.name, c.slug]));
  const result: string[] = [];
  for (const name of DEFAULT_ADD_ON_CATEGORY_NAMES) {
    const slug = slugByName.get(name);
    if (slug) result.push(slug);
  }
  return result;
}

export async function getAddOnCategoriesOrder(): Promise<string[]> {
  return unstable_cache(getAddOnCategoriesOrderUncached, ["add-on-products"], {
    revalidate: 300,
    tags: ["add-on-products", "categories"],
  })();
}

type ProductWithCategory = {
  id: string;
  slug: string;
  categorySlug?: string | null;
  categorySlugs?: string[] | null;
};

/**
 * Собирает список товаров для блока «Хотите добавить к заказу?» в строго повторяющемся порядке:
 * по одному товару из каждой категории в заданном порядке, затем цикл повторяется.
 * Товар с id === excludeProductId не включается.
 * Категории без товаров пропускаются, общий порядок не меняется.
 */
export function buildAddToOrderProducts<T extends ProductWithCategory>(
  allProducts: T[],
  categoryOrder: string[],
  excludeProductId: string
): T[] {
  if (!categoryOrder.length) return [];

  const byCategory = new Map<string, T[]>();
  for (const slug of categoryOrder) {
    const list = filterProductsByCategorySlug(allProducts, slug).filter((p) => p.id !== excludeProductId);
    if (list.length > 0) byCategory.set(slug, list);
  }

  const result: T[] = [];
  const categoryLists = categoryOrder
    .map((slug) => byCategory.get(slug))
    .filter((list): list is T[] => Boolean(list && list.length > 0));
  if (!categoryLists.length) return [];

  const indices = categoryLists.map(() => 0);
  const maxRounds = 1000;
  let rounds = 0;
  while (rounds < maxRounds) {
    let added = 0;
    for (let i = 0; i < categoryLists.length; i++) {
      const list = categoryLists[i];
      const idx = indices[i];
      if (idx < list.length) {
        result.push(list[idx]);
        indices[i] = idx + 1;
        added++;
      }
    }
    if (added === 0) break;
    rounds++;
  }

  return result;
}
