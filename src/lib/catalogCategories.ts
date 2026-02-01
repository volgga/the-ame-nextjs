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
 * Использует поле categorySlug у товара (из products/variant_products).
 */
export function filterProductsByCategorySlug<T extends { slug: string; categorySlug?: string | null }>(
  products: T[],
  categorySlug: string
): T[] {
  return products.filter((p) => p.categorySlug === categorySlug);
}

export function isValidCategorySlug(slug: string | null | undefined, validSlugs: Set<string>): slug is string {
  return typeof slug === "string" && validSlugs.has(slug);
}
