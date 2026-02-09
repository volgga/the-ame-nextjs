/**
 * Справочник цветов букета для фильтра «Цвет букета».
 * Единый источник для админки и витрины.
 */

export type BouquetColorSwatch =
  | { type: "solid"; color: string }
  | { type: "rainbow" };

export type BouquetColorItem = {
  key: string;
  label: string;
  swatch: BouquetColorSwatch;
};

export const BOUQUET_COLORS: BouquetColorItem[] = [
  { key: "persikovyy", label: "Персиковый", swatch: { type: "solid", color: "#f4c2a8" } },
  { key: "krasnyy", label: "Красный", swatch: { type: "solid", color: "#c41e3a" } },
  { key: "belyy", label: "Белый", swatch: { type: "solid", color: "#ffffff" } },
  { key: "rozovyy", label: "Розовый", swatch: { type: "solid", color: "#ffb7c5" } },
  { key: "nezhnyy", label: "Нежный", swatch: { type: "solid", color: "#f5e6d3" } },
  { key: "yarkiy", label: "Яркий", swatch: { type: "solid", color: "#c71585" } },
  { key: "kremovyy", label: "Кремовый", swatch: { type: "solid", color: "#fff8dc" } },
  { key: "malinovyy", label: "Малиновый", swatch: { type: "solid", color: "#dc143c" } },
  { key: "bordo", label: "Бордо", swatch: { type: "solid", color: "#722f37" } },
  { key: "raznotsvetnyy", label: "Разноцветный", swatch: { type: "rainbow" } },
];

const KEY_SET = new Set(BOUQUET_COLORS.map((c) => c.key));

export function getBouquetColorByKey(key: string): BouquetColorItem | undefined {
  return BOUQUET_COLORS.find((c) => c.key === key);
}

export function isValidBouquetColorKey(key: string): boolean {
  return KEY_SET.has(key);
}

export function filterValidBouquetColorKeys(keys: string[]): string[] {
  return keys.filter((k) => KEY_SET.has(k));
}
