export type AdminFetchMeta = {
  method: string;
  url: string;
};

export type AdminFetchResult<T = unknown> = {
  ok: boolean;
  status: number;
  data: T | null;
  rawText: string;
  isJson: boolean;
  /**
   * Сообщение для отображения пользователю при ошибке.
   * Формат: HTTP ${status} ${method} ${url}: ${rawText.slice(0,200)}
   */
  message?: string;
};

/**
 * Безопасный разбор ответа админских API.
 * - читает тело один раз через res.text()
 * - пытается JSON.parse только если content-type указывает на JSON
 * - никогда не прокидывает SyntaxError наружу
 * - на ошибке формирует человекочитаемое сообщение с HTTP статусом, URL и первыми 200 символами тела
 * - логирует диагностику если получен HTML вместо JSON
 */
export async function parseAdminResponse<T = unknown>(
  res: Response,
  meta: AdminFetchMeta
): Promise<AdminFetchResult<T>> {
  const method = meta.method.toUpperCase();
  const url = meta.url;

  let rawText = "";
  try {
    rawText = await res.text();
  } catch {
    // Если чтение тела само по себе упало — считаем, что текста нет.
    rawText = "";
  }

  const contentType = res.headers.get("content-type") ?? "";
  const isHtml =
    contentType.includes("text/html") ||
    rawText.trim().startsWith("<!DOCTYPE") ||
    rawText.trim().startsWith("<html");
  let data: T | null = null;
  let isJson = false;

  // Диагностика: если получили HTML вместо JSON (часто 413 от nginx)
  if (!res.ok && isHtml) {
    console.error(
      `[parseAdminResponse] API returned HTML instead of JSON:`,
      `\n  URL: ${method} ${url}`,
      `\n  Status: ${res.status}`,
      `\n  Content-Type: ${contentType}`,
      `\n  Response preview: ${rawText.slice(0, 500)}`
    );
  }

  if (contentType.includes("application/json")) {
    try {
      data = rawText ? (JSON.parse(rawText) as T) : null;
      isJson = true;
    } catch {
      // Не прокидываем SyntaxError наружу
      data = null;
      isJson = false;
      // Дополнительная диагностика если content-type был JSON, но парсинг не удался
      if (rawText && !rawText.trim().startsWith("{")) {
        console.error(
          `[parseAdminResponse] Failed to parse JSON response:`,
          `\n  URL: ${method} ${url}`,
          `\n  Status: ${res.status}`,
          `\n  Content-Type: ${contentType}`,
          `\n  Response preview: ${rawText.slice(0, 500)}`
        );
      }
    }
  }

  const ok = res.ok;
  const status = res.status;

  let message: string | undefined;
  if (!ok || !isJson) {
    // 413 от nginx — запрос отсечён прокси до Next.js (HTML-страница)
    if (status === 413 || (isHtml && (rawText.includes("413") || rawText.includes("Request Entity Too Large")))) {
      message =
        "Слишком большой запрос или ограничение прокси. Проверьте client_max_body_size в nginx (рекомендуется 30m).";
    } else if (isHtml) {
      message = `Сервер вернул HTML вместо JSON (HTTP ${status}). Проверьте прокси и доступность API.`;
    } else {
      message = `HTTP ${status} ${method} ${url}: ${rawText.slice(0, 200)}`;
    }
  }

  return {
    ok,
    status,
    data,
    rawText,
    isJson,
    message,
  };
}

