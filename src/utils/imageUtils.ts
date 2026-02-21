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

/** Короткий хеш строки для cache-bust (fallback, когда нет updated_at) */
export function imageUrlVersion(url: string | null | undefined): string {
  const s = typeof url === "string" ? url.trim() : "";
  if (!s) return "";
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/**
 * Версия для cache-bust: updated_at из БД (лучше) или fallback.
 * updated_at меняется при обновлении товара/фото — браузер подтянет новое изображение.
 */
export function imageVersionFromUpdatedAt(updatedAt?: string | null): string | undefined {
  const s = typeof updatedAt === "string" ? updatedAt.trim() : "";
  if (!s) return undefined;
  // ISO date → короткий токен (timestamp или slug)
  try {
    const ts = new Date(s).getTime();
    return isNaN(ts) ? undefined : ts.toString(36);
  } catch {
    return s.slice(0, 20).replace(/[^a-zA-Z0-9]/g, "");
  }
}

/** Добавить query-параметр v= к URL, чтобы при смене изображения кэш браузера не отдавал старое */
export function addImageCacheBust(
  url: string | null | undefined,
  version?: string | null
): string {
  const s = typeof url === "string" ? url.trim() : "";
  if (!s) return "";
  const v = (version && String(version).trim()) || imageUrlVersion(s) || "1";
  const sep = s.includes("?") ? "&" : "?";
  return `${s}${sep}v=${encodeURIComponent(v)}`;
}
