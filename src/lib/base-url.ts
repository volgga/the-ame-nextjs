/**
 * Base URL helpers для сервера и клиента.
 *
 * Важные абсолютные ссылки (оплата, вебхуки, Telegram и т.п.)
 * должны собираться через эти функции, а не хардкодиться.
 */

/**
 * Базовый URL для серверного кода (API routes, webhooks).
 *
 * Приоритет:
 * 1) SITE_URL          — чисто серверная переменная (рекомендуется на проде)
 * 2) NEXT_PUBLIC_SITE_URL — fallback, если отдельный SITE_URL не задан
 *
 * Возвращает пустую строку, если обе переменные отсутствуют — вызывающий код
 * обязан проверить это и вывести понятную ошибку.
 */
export function getServerBaseUrl(): string {
  return process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "";
}

const PRODUCTION_BASE = "https://theame.ru";

/**
 * Базовый URL для публичных ссылок (sitemap, canonical и т.п.).
 *
 * Приоритет:
 * 1) NEXT_PUBLIC_SITE_URL
 * 2) жёсткий дефолт https://theame.ru
 */
export function getPublicBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || PRODUCTION_BASE;
}

/**
 * Базовый URL для sitemap.xml — всегда прод, без localhost.
 * NEXT_PUBLIC_SITE_URL вшивается в билд; если билд делали с localhost, в sitemap попадёт localhost и GSC ругается.
 * Используйте эту функцию только при генерации sitemap.
 */
export function getSitemapBaseUrl(): string {
  const fromEnv = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "";
  const base = fromEnv.replace(/\/$/, "") || PRODUCTION_BASE;
  if (base.includes("localhost")) return PRODUCTION_BASE;
  return base;
}

