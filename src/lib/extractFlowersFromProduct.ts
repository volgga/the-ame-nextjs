/**
 * Утилита для извлечения цветов из товара.
 * Единая логика для избежания дублирования кода.
 */

import type { Product } from "@/lib/products";
import { parseCompositionFlowers } from "@/lib/parseCompositionFlowers";

/**
 * Извлекает массив цветов из товара.
 * Приоритет: compositionFlowers, затем парсинг из composition.
 *
 * @param product - товар
 * @returns массив названий цветов (нормализованные)
 */
export function extractFlowersFromProduct(product: Product): string[] {
  // Приоритет: compositionFlowers, затем парсинг из composition
  if (product.compositionFlowers && product.compositionFlowers.length > 0) {
    return product.compositionFlowers;
  }
  if (product.composition) {
    return parseCompositionFlowers(product.composition);
  }
  return [];
}

/**
 * Извлекает уникальные цветы из массива товаров.
 * Используется для генерации списка доступных цветов.
 *
 * @param products - массив товаров
 * @returns отсортированный массив уникальных названий цветов
 */
export function extractUniqueFlowers(products: Product[]): string[] {
  const flowerSet = new Map<string, string>(); // lowercase -> normalized

  for (const product of products) {
    const productFlowers = extractFlowersFromProduct(product);

    // Добавляем в Set (lowercase для уникальности)
    for (const flower of productFlowers) {
      const lowerKey = flower.toLowerCase();
      if (!flowerSet.has(lowerKey)) {
        flowerSet.set(lowerKey, flower);
      }
    }
  }

  // Сортируем по алфавиту (по нормализованному названию)
  return Array.from(flowerSet.values()).sort((a, b) => a.localeCompare(b, "ru"));
}
