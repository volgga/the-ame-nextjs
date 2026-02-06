/**
 * SEO constants and helpers — single source of truth for theame.ru
 * Used for metadata (title, description, canonical, robots) across all pages.
 */

export const SITE_NAME = "The Ame";
export const CANONICAL_BASE = "https://theame.ru";
export const LOCALE = "ru_RU";
export const CITY_KEYWORD = "Сочи";

/** Default robots for indexable pages */
export const ROBOTS_INDEX_FOLLOW = { index: true as const, follow: true as const };

/** Robots for placeholder/empty pages — noindex but allow following links */
export const ROBOTS_NOINDEX_FOLLOW = { index: false as const, follow: true as const };

/** Default title template: "{pageTitle} | The Ame" */
export const TITLE_TEMPLATE = "%s | The Ame";

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
 * Trim and strip HTML from text for meta description (max length ~160).
 */
export function trimDescription(text: string | null | undefined, maxLength = 160): string {
  if (!text || typeof text !== "string") return "";
  const stripped = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (stripped.length <= maxLength) return stripped;
  const cut = stripped.slice(0, maxLength - 3);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + "...";
}

/**
 * Check if URL has "indexable" query params that we want to noindex (filters, sort, search, UTM).
 * If any of these are present, we recommend noindex,follow for that request.
 */
const INDEXABLE_PARAMS = new Set([
  "sort",
  "minPrice",
  "maxPrice",
  "q",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
]);

export function hasIndexableQueryParams(searchParams: URLSearchParams | Record<string, string | string[] | undefined>): boolean {
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
