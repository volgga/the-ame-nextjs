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
  let data: T | null = null;
  let isJson = false;

  if (contentType.includes("application/json")) {
    try {
      data = rawText ? (JSON.parse(rawText) as T) : null;
      isJson = true;
    } catch {
      // Не прокидываем SyntaxError наружу
      data = null;
      isJson = false;
    }
  }

  const ok = res.ok;
  const status = res.status;

  const message =
    !ok || !isJson
      ? `HTTP ${status} ${method} ${url}: ${rawText.slice(0, 200)}`
      : undefined;

  return {
    ok,
    status,
    data,
    rawText,
    isJson,
    message,
  };
}

