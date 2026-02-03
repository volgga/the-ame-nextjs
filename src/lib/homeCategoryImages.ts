/**
 * Маппинг slug категории → URL изображения для блока категорий на главной.
 * Используется, если в таблице categories нет поля image/photo.
 * Местоположение маппинга: src/lib/homeCategoryImages.ts
 */

import type { Category } from "@/lib/categories";

const DEFAULT_CATEGORY_IMAGE = "https://theame.ru/placeholder.svg";

/** Порядок и список категорий для плитки «КОЛЛЕКЦИИ THE ÁME». 6 карточек (5 из БД + статическая «Корзины цветов»). */
export const HOME_CATEGORY_NAMES = [
  "14 февраля",
  "Сейчас сезон",
  "Авторские букеты",
  "Моно и дуо-букеты",
  "Цветы в коробке",
  "Корзины цветов",
] as const;

/** Варианты названий в БД для одной и той же позиции */
const HOME_CATEGORY_ALIASES: Record<string, (typeof HOME_CATEGORY_NAMES)[number]> = {
  "Корзины с цветами": "Корзины цветов",
  "Корзина с цветами": "Корзины цветов",
  "Композиции в коробке": "Цветы в коробке",
  "Моно букеты": "Моно и дуо-букеты",
};

/** slug (из БД или slugify названия) → URL картинки для плитки на главной */
export const CATEGORY_SLUG_TO_IMAGE: Record<string, string> = {
  "14-fevralya": DEFAULT_CATEGORY_IMAGE,
  "seychas-sezon": DEFAULT_CATEGORY_IMAGE,
  "avtorskie-bukety": DEFAULT_CATEGORY_IMAGE,
  "mono-i-duo-bukety": DEFAULT_CATEGORY_IMAGE,
  "mono-bukety": DEFAULT_CATEGORY_IMAGE,
  "cvety-v-korobke": DEFAULT_CATEGORY_IMAGE,
  "kompozicii-v-korobke": DEFAULT_CATEGORY_IMAGE,
  "korziny-s-cvetami": DEFAULT_CATEGORY_IMAGE,
  "korziny-cvetov": DEFAULT_CATEGORY_IMAGE,
  "korzina-s-cvetami": DEFAULT_CATEGORY_IMAGE,
  "premium": DEFAULT_CATEGORY_IMAGE,
  "rozy": DEFAULT_CATEGORY_IMAGE,
  "roses": DEFAULT_CATEGORY_IMAGE,
};

export function getCategoryImageUrl(slug: string): string {
  return CATEGORY_SLUG_TO_IMAGE[slug] ?? DEFAULT_CATEGORY_IMAGE;
}

/** Категория с отображаемым названием (для плитки на главной) */
export type HomeCategoryItem = Category & { displayName: string };

/**
 * Отфильтровать и упорядочить категории для главной (плитка «КОЛЛЕКЦИИ THE ÁME»).
 * Возвращает только 5 категорий: 14 февраля, Сейчас сезон, Авторские букеты, Моно и дуо-букеты, Цветы в коробке.
 * Карточка «Корзины цветов» добавляется статически в HomeCategoryTiles.
 */
export function getHomeCategoriesOrdered(allCategories: Category[]): HomeCategoryItem[] {
  const orderMap = new Map<string, number>(HOME_CATEGORY_NAMES.slice(0, 5).map((name, i) => [name, i]));
  return allCategories
    .filter((c) => orderMap.has(c.name) || orderMap.has(HOME_CATEGORY_ALIASES[c.name]))
    .filter((c) => {
      const displayName = HOME_CATEGORY_ALIASES[c.name] ?? c.name;
      return orderMap.has(displayName);
    })
    .map((c) => ({
      ...c,
      displayName: HOME_CATEGORY_ALIASES[c.name] ?? c.name,
    }))
    .sort((a, b) => (orderMap.get(a.displayName) ?? 999) - (orderMap.get(b.displayName) ?? 999));
}
