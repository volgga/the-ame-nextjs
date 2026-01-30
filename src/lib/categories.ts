/**
 * Единый источник категорий каталога.
 * Используется в CategoryNav (хедер), Footer (колонка «Каталог») и при фильтрации.
 * При добавлении новых разделов они автоматически появятся в навигации и футере.
 */
export const catalogCategories = [
  { name: "Авторские букеты", slug: "avtorskie-bukety" },
  { name: "Монобукеты", slug: "monobukety" },
  { name: "Цветы в корзине/коробке", slug: "tsvety-v-korzine-korobke" },
  { name: "Премиум", slug: "premium" },
  { name: "Розы", slug: "rozy" },
  { name: "Подарки", slug: "podarki" },
  { name: "Вазы", slug: "vazy" },
] as const;

export type CatalogCategorySlug = (typeof catalogCategories)[number]["slug"];
