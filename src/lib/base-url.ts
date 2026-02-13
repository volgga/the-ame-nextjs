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
 * Базовый URL для sitemap.xml — всегда прод (https://theame.ru), без localhost.
 * GSC не принимает localhost; env может быть не задан при билде/рантайме.
 * Жёстко используем PRODUCTION_BASE, чтобы sitemap всегда был корректен.
 */
export function getSitemapBaseUrl(): string {
  return PRODUCTION_BASE;
}

