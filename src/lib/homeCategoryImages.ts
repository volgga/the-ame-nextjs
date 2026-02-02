/**
 * Маппинг slug категории → URL изображения для блока категорий на главной.
 * Используется, если в таблице categories нет поля image/photo.
 * Местоположение маппинга: src/lib/homeCategoryImages.ts
 */

import type { Category } from "@/lib/categories";

const DEFAULT_CATEGORY_IMAGE = "https://theame.ru/placeholder.svg";

/** Порядок и список категорий для плитки на главной (строго по ТЗ). 8 категорий. */
export const HOME_CATEGORY_NAMES = [
  "14 февраля",
  "Сейчас сезон",
  "Авторские букеты",
  "Моно и дуо-букеты",
  "Цветы в коробке",
  "Корзина с цветами",
  "Премиум",
  "Розы",
] as const;

/** Варианты названий в БД для одной и той же позиции (например «Корзины с цветами» → слот «Корзина с цветами») */
const HOME_CATEGORY_ALIASES: Record<string, (typeof HOME_CATEGORY_NAMES)[number]> = {
  "Корзины с цветами": "Корзина с цветами",
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
 * Отфильтровать и упорядочить категории для главной (плитка).
 * Учитывает алиасы: «Корзины с цветами» в БД → слот «Корзина с цветами».
 */
export function getHomeCategoriesOrdered(allCategories: Category[]): HomeCategoryItem[] {
  const orderMap = new Map<string, number>(HOME_CATEGORY_NAMES.map((name, i) => [name, i]));
  return allCategories
    .filter((c) => orderMap.has(c.name) || orderMap.has(HOME_CATEGORY_ALIASES[c.name]))
    .map((c) => ({
      ...c,
      displayName: HOME_CATEGORY_ALIASES[c.name] ?? c.name,
    }))
    .sort((a, b) => (orderMap.get(a.displayName) ?? 999) - (orderMap.get(b.displayName) ?? 999));
}
