/**
 * Утилита для получения списка всех уникальных цветов из товаров.
 * Используется в админке для отображения чекбоксов цветов.
 */

import { getAllCatalogProducts } from "@/lib/products";
import { extractUniqueFlowers } from "@/lib/extractFlowersFromProduct";

/**
 * Получает список всех уникальных цветов из всех товаров каталога.
 * Приоритет: compositionFlowers, затем парсинг из composition.
 * Возвращает отсортированный массив нормализованных названий цветов.
 */
export async function getAllFlowers(): Promise<string[]> {
  const products = await getAllCatalogProducts();
  return extractUniqueFlowers(products);
}
