/**
 * Список уникальных цветов из состава товаров для фильтра «Цветы в составе».
 * Строится автоматически из composition + compositionFlowers товаров и вариантов.
 * Нормализация: убрать числа/единицы, lowercase, один пробел, dedupe по ключу.
 */

import type { Product } from "@/lib/products";
import { parseCompositionFlowers } from "@/lib/parseCompositionFlowers";
import { normalizeFlowerKey } from "@/lib/normalizeFlowerKey";

export type CatalogFlowerOption = { slug: string; label: string };

/**
 * Собирает все уникальные названия цветов из товаров и вариантов.
 * Ключ для dedupe и URL — normalizeFlowerKey. Label — первое встреченное отображаемое название.
 */
export function getCatalogFlowersFromProducts(products: Product[]): CatalogFlowerOption[] {
  const bySlug = new Map<string, string>(); // slug -> label

  function add(name: string) {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length < 2) return;
    const slug = normalizeFlowerKey(trimmed);
    if (!slug) return;
    if (!bySlug.has(slug)) {
      bySlug.set(slug, trimmed);
    }
  }

  for (const p of products) {
    if (p.compositionFlowers?.length) {
      for (const name of p.compositionFlowers) {
        if (typeof name === "string") add(name);
      }
    }
    if (p.composition?.trim()) {
      for (const name of parseCompositionFlowers(p.composition)) {
        add(name);
      }
    }
    if (p.variants?.length) {
      for (const v of p.variants) {
        if (v.composition?.trim()) {
          for (const name of parseCompositionFlowers(v.composition)) {
            add(name);
          }
        }
      }
    }
  }

  const list = Array.from(bySlug.entries())
    .map(([slug, label]) => ({ slug, label }))
    .sort((a, b) => a.label.localeCompare(b.label, "ru"));
  return list;
}

/**
 * Проверяет, есть ли в товаре (или в любом варианте) цветок с данным slug (нормализованный ключ).
 */
export function productHasFlowerSlug(product: Product, flowerSlug: string): boolean {
  if (!flowerSlug.trim()) return true;

  function matches(name: string): boolean {
    return normalizeFlowerKey(name) === flowerSlug;
  }

  if (product.compositionFlowers?.some(matches)) return true;
  if (product.composition?.trim()) {
    const parsed = parseCompositionFlowers(product.composition);
    if (parsed.some(matches)) return true;
  }
  if (product.variants?.length) {
    for (const v of product.variants) {
      if (v.composition?.trim()) {
        const parsed = parseCompositionFlowers(v.composition);
        if (parsed.some(matches)) return true;
      }
    }
  }
  return false;
}
