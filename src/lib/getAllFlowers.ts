/**
 * Единый источник списка "Цветы в составе" для витрины.
 * Список берётся из справочника flowers (таблица flowers), а не из товаров.
 * Для сырого списка имён из товаров см. extractUniqueFlowers в extractFlowersFromProduct.
 */

import { getFlowersForCatalog } from "@/lib/flowers";
import type { Flower } from "@/lib/flowers";

export type FlowerInCompositionItem = {
  id?: string;
  name: string;
  slug: string;
  is_active?: boolean;
};

/**
 * Получает список цветов в составе для витрины (чипы фильтра, страницы по цветку).
 * Данные из справочника flowers (isActive=true, по order).
 */
export async function getFlowersInCompositionList(): Promise<FlowerInCompositionItem[]> {
  const flowers = await getFlowersForCatalog();
  return flowers.map((f: Flower) => ({
    id: f.id,
    name: f.name,
    slug: f.slug,
    is_active: f.is_active,
  }));
}
