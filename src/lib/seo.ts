/**
 * SEO constants and helpers — single source of truth for theame.ru
 * Used for metadata (title, description, canonical, robots) across all pages.
 *
 * Duplicate prevention:
 * - Canonical URLs are always absolute, https, no trailing slash, no query params.
 * - Middleware enforces www → non-www and http → https (see src/middleware.ts).
 * - Pages with filter/sort/UTM params (category, magazin) set noindex,follow via hasIndexableQueryParams.
 */

export const SITE_NAME = "The Ame";
export const CANONICAL_BASE = "https://theame.ru";
export const LOCALE = "ru_RU";
export const CITY_KEYWORD = "Сочи";
export const CITY = "Сочи"; // Для использования в метатегах

/** Default robots for indexable pages */
export const ROBOTS_INDEX_FOLLOW = { index: true as const, follow: true as const };
export const DEFAULT_ROBOTS = ROBOTS_INDEX_FOLLOW; // Алиас для спекы

/** Robots for placeholder/empty pages — noindex but allow following links */
export const ROBOTS_NOINDEX_FOLLOW = { index: false as const, follow: true as const };

/**
 * Не используем глобальный title template в layout — каждая страница задаёт полный title
 * (включая "| The Ame"), иначе получается дубль "... | The Ame | The Ame".
 */

/**
 * Build absolute canonical URL (no trailing slash, no query params).
 * Path should start with "/" (e.g. "/about", "/product/slug").
 */
export function canonicalUrl(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  const withoutTrailing = clean.replace(/\/+$/, "") || "/";
  return `${CANONICAL_BASE}${withoutTrailing}`;
}

/**
 * Normalize category name for SEO title: avoid duplicating "в Сочи" / "доставка" if already present.
 */
export function normalizeCategoryNameForTitle(name: string): string {
  const lower = name.trim().toLowerCase();
  if (lower.includes("в сочи") || lower.includes("доставка")) {
    return name.trim();
  }
  return name.trim();
}

/**
 * Нормализация текста для meta description:
 * - Удаляет HTML-теги
 * - Убирает лишние пробелы, переносы строк, табы
 * - Нормализует кавычки
 * - Удаляет двойные пробелы
 */
export function normalizeText(text: string | null | undefined): string {
  if (!text || typeof text !== "string") return "";

  // Удаляем HTML-теги и заменяем на пробелы
  let normalized = text.replace(/<[^>]+>/g, " ");

  // Заменяем различные типы пробелов и переносов на обычный пробел
  normalized = normalized.replace(/[\r\n\t\u00A0\u2000-\u200B\u2028\u2029]+/g, " ");

  // Нормализуем кавычки (разные типы кавычек → обычные)
  normalized = normalized.replace(/["""'']/g, '"');

  // Удаляем множественные пробелы
  normalized = normalized.replace(/\s+/g, " ");

  // Убираем пробелы в начале и конце
  return normalized.trim();
}

/**
 * Обрезает текст до указанной длины по словам (для meta description, max ~160 символов).
 * Использует normalizeText для предварительной очистки.
 */
export function truncateDescription(text: string | null | undefined, maxLength = 160): string {
  const normalized = normalizeText(text);
  if (!normalized) return "";

  if (normalized.length <= maxLength) return normalized;

  // Обрезаем до maxLength - 3 (для "..."), затем ищем последний пробел
  const cut = normalized.slice(0, maxLength - 3);
  const lastSpace = cut.lastIndexOf(" ");

  // Если пробел найден и не в самом начале — обрезаем по пробелу
  // Иначе обрезаем жестко (для очень длинных слов)
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + "...";
}

/**
 * Trim and strip HTML from text for meta description (max length ~160).
 * @deprecated Используйте truncateDescription для лучшей нормализации текста.
 */
export function trimDescription(text: string | null | undefined, maxLength = 160): string {
  return truncateDescription(text, maxLength);
}

/**
 * Check if URL has "indexable" query params that we want to noindex (filters, sort, search, UTM).
 * If any of these are present, we recommend noindex,follow for that request.
 */
const INDEXABLE_PARAMS = new Set([
  "sort",
  "price",
  "minPrice",
  "maxPrice",
  "q",
  "colors",
  "flower", // Фильтр «Цветы в составе»
  "page", // Пагинация
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
]);

export function hasIndexableQueryParams(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
): boolean {
  if (searchParams instanceof URLSearchParams) {
    for (const key of searchParams.keys()) {
      if (INDEXABLE_PARAMS.has(key.toLowerCase())) return true;
    }
    return false;
  }
  for (const key of Object.keys(searchParams)) {
    if (INDEXABLE_PARAMS.has(key.toLowerCase())) return true;
  }
  return false;
}

/**
 * Автоматическая генерация meta description из HTML контента (fallback для excerpt).
 * Удаляет HTML теги, нормализует пробелы, обрезает до maxLen символов без обрыва слова.
 *
 * @param input - HTML контент или текст
 * @param maxLen - Максимальная длина (по умолчанию 160 символов)
 * @returns Описание для meta description
 */
export function buildAutoDescription(input: string | null | undefined, maxLen = 160): string {
  // Если input пустой → возвращаем безопасный дефолт
  if (!input || typeof input !== "string" || input.trim().length === 0) {
    return "Статья в блоге The Ame о цветах, флористике и вдохновении.";
  }

  // Удаляем HTML теги и заменяем на пробелы
  let text = input.replace(/<[^>]+>/g, " ");

  // Декодируем базовые HTML сущности (минимум: &nbsp; → пробел)
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Сжимаем множественные пробелы, переносы строк, табы в один пробел
  text = text.replace(/[\r\n\t\u00A0\u2000-\u200B\u2028\u2029]+/g, " ");
  text = text.replace(/\s+/g, " ");

  // Убираем пробелы в начале и конце
  text = text.trim();

  // Если текст пустой после очистки → дефолт
  if (text.length === 0) {
    return "Статья в блоге The Ame о цветах, флористике и вдохновении.";
  }

  // Если текст короче maxLen → возвращаем как есть
  if (text.length <= maxLen) {
    return text;
  }

  // Обрезаем до maxLen - 1 (для многоточия), ищем последний пробел
  const cut = text.slice(0, maxLen - 1);
  const lastSpace = cut.lastIndexOf(" ");

  // Если пробел найден и не в самом начале → обрезаем по пробелу
  // Иначе обрезаем жестко (для очень длинных слов)
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + "…";
}
