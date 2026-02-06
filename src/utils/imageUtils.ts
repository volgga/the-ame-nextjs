/** Placeholder для битых/отсутствующих изображений */
export const PLACEHOLDER_IMAGE = "/placeholder.svg";

/** Проверка валидности URL изображения */
export function isValidImageUrl(url: string | null | undefined): boolean {
  const s = typeof url === "string" ? url.trim() : "";
  return s.length > 0 && (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/"));
}

/** Нормализация URL: trim, без лишних пробелов */
export function normalizeImageUrl(url: string | null | undefined): string {
  const s = typeof url === "string" ? url.trim() : "";
  return isValidImageUrl(s) ? s : PLACEHOLDER_IMAGE;
}
