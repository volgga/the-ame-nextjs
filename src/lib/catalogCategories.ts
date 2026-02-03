import type { Category } from "@/lib/categories";

/**
 * Категории каталога. Используется с getCategories() из @/lib/categories.
 * Фильтрация товаров по полю categorySlug.
 */

/** Страница «Все цветы» — виртуальная категория каталога */
export const ALL_CATALOG = {
  title: "Все цветы",
  description:
    "Все цветы The Áme — аккуратные букеты и гармоничные композиции для любого повода. Идеальный выбор, чтобы порадовать близких, создать настроение и подарить эмоции без лишних слов.",
  href: "/posmotret-vse-tsvety",
} as const;

/** Страница «Каталог» — главная страница каталога (/magazin) */
export const CATALOG_PAGE = {
  title: "Каталог",
  href: "/magazin",
} as const;

/** Слаги категории «Популярное» — пробуем по порядку (в БД может быть populyarnoe или popularnoe) */
export const POPULAR_CATEGORY_SLUG_CANDIDATES = ["populyarnoe", "popularnoe"] as const;

/** Основной слаг для обратной совместимости (первый из кандидатов) */
export const POPULAR_CATEGORY_SLUG = POPULAR_CATEGORY_SLUG_CANDIDATES[0];

/** Максимум товаров в блоке «Рекомендуем» (лента в одну строку) */
export const RECOMMEND_MAX = 12;

/** Fallback для CatalogDropdown, если категории ещё не загружены */
export const FALLBACK_CATEGORIES: { label: string; slug: string }[] = [
  { label: "Авторские букеты", slug: "avtorskie-bukety" },
  { label: "Моно букеты", slug: "mono-bukety" },
  { label: "Композиции в коробке", slug: "kompozicii-v-korobke" },
  { label: "Вазы", slug: "vazy" },
];

export function categoriesToNav(categories: Category[]): { label: string; slug: string }[] {
  return categories.map((c) => ({ label: c.name, slug: c.slug }));
}

/**
 * Отфильтровать товары по slug категории.
 * Учитывает categorySlug и массив categorySlugs (из products/variant_products).
 */
export function filterProductsByCategorySlug<
  T extends { slug: string; categorySlug?: string | null; categorySlugs?: string[] | null }
>(products: T[], categorySlug: string): T[] {
  return products.filter(
    (p) => p.categorySlug === categorySlug || (p.categorySlugs && p.categorySlugs.includes(categorySlug))
  );
}

type ProductWithCategory = { slug: string; categorySlug?: string | null; categorySlugs?: string[] | null };

/**
 * Товары для блока «Рекомендуем»: перебираем кандидатов slug (populyarnoe, popularnoe),
 * возвращаем первый непустой результат и слаг, который сработал.
 */
export function getRecommendProducts<T extends ProductWithCategory>(
  products: T[],
  maxItems: number = RECOMMEND_MAX
): { products: T[]; usedSlug: string | null } {
  for (const slug of POPULAR_CATEGORY_SLUG_CANDIDATES) {
    const filtered = filterProductsByCategorySlug(products, slug);
    if (filtered.length > 0) {
      return { products: filtered.slice(0, maxItems), usedSlug: slug };
    }
  }
  return { products: [], usedSlug: null };
}

export function isValidCategorySlug(slug: string | null | undefined, validSlugs: Set<string>): slug is string {
  return typeof slug === "string" && validSlugs.has(slug);
}
