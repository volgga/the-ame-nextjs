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

/** Короткий хеш строки для cache-bust (при смене фото товара URL меняется — браузер подтянет новое) */
export function imageUrlVersion(url: string | null | undefined): string {
  const s = typeof url === "string" ? url.trim() : "";
  if (!s) return "";
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/** Добавить query-параметр v= к URL, чтобы при смене изображения кэш браузера не отдавал старое */
export function addImageCacheBust(url: string | null | undefined, version?: string): string {
  const s = typeof url === "string" ? url.trim() : "";
  if (!s) return "";
  const v = version ?? imageUrlVersion(s);
  const sep = s.includes("?") ? "&" : "?";
  return `${s}${sep}v=${v}`;
}
