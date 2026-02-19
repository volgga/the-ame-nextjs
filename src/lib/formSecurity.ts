/**
 * Утилиты безопасности для форм: rate limiting и honeypot.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Rate limit хранилище в памяти процесса
// Ключ: IP адрес, значение: счетчик запросов и время сброса
const rateLimitMap = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 60 секунд
const RATE_LIMIT_MAX_REQUESTS = 15; // максимум 15 запросов в минуту (формы: one-click, bouquet, preorder, gift-hint)

/**
 * Проверяет rate limit для IP адреса.
 *
 * @param ip - IP адрес клиента
 * @returns true если лимит не превышен, false если превышен
 */
export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry) {
    // Первый запрос с этого IP
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (now > entry.resetAt) {
    // Окно истекло, сбрасываем счетчик
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    // Лимит превышен
    return false;
  }

  // Увеличиваем счетчик
  entry.count++;
  return true;
}

/**
 * Очищает старые записи из rate limit map (вызывать периодически).
 */
export function cleanupRateLimit(): void {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(ip);
    }
  }
}

/**
 * Получает IP адрес из Request.
 *
 * @param request - Request объект
 * @returns IP адрес или "unknown"
 */
export function getClientIP(request: Request): string {
  // Проверяем заголовки прокси
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",").map((ip) => ip.trim());
    return ips[0] || "unknown";
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // В serverless окружении IP может быть недоступен
  return "unknown";
}

/**
 * Проверяет honeypot поле.
 *
 * @param data - Данные формы
 * @returns true если honeypot пустой (норма), false если заполнен (бот)
 */
export function checkHoneypot(data: Record<string, unknown>): boolean {
  const honeypot = data._hp;
  // Если поле заполнено (не пустая строка, не null, не undefined) - это бот
  if (honeypot !== undefined && honeypot !== null && honeypot !== "") {
    return false;
  }
  return true;
}
