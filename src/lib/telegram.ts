/**
 * Отправка сообщений в Telegram через Bot API.
 */

interface TelegramResponse {
  ok: boolean;
  description?: string;
  error_code?: number;
  result?: unknown;
}

const FETCH_TIMEOUT_MS = 7000; // 7 секунд
const MAX_RETRIES = 1; // 1 retry

/**
 * Выполняет fetch с таймаутом.
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Таймаут запроса к Telegram API (${timeoutMs}ms)`);
    }
    throw error;
  }
}

/**
 * Проверяет, нужно ли делать retry для ошибки.
 */
function shouldRetry(status: number | null, _error: unknown): boolean {
  // Не retry на 4xx ошибки (клиентские ошибки)
  if (status !== null && status >= 400 && status < 500) {
    return false;
  }
  // Retry на 5xx ошибки и сетевые ошибки
  return true;
}

/**
 * Выполняет запрос к Telegram API с retry.
 */
async function sendTelegramRequest(
  url: string,
  body: Record<string, unknown>,
  retryCount: number = 0
): Promise<void> {
  let lastError: Error | null = null;
  let lastStatus: number | null = null;
  let lastResponseText: string | null = null;

  try {
    const response = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
      FETCH_TIMEOUT_MS
    );

    lastStatus = response.status;
    lastResponseText = await response.text().catch(() => null);

    let data: TelegramResponse;
    try {
      data = JSON.parse(lastResponseText || "{}") as TelegramResponse;
    } catch {
      // Если не удалось распарсить JSON, создаем объект с ошибкой
      data = {
        ok: false,
        description: `Неверный формат ответа от Telegram API (статус: ${response.status})`,
      };
    }

    if (!data.ok) {
      const errorMessage =
        data.description ||
        `Telegram API вернул ошибку (код: ${data.error_code || "unknown"}, статус HTTP: ${response.status})`;
      const error = new Error(errorMessage);
      (error as Error & { status?: number; responseText?: string }).status = response.status;
      (error as Error & { status?: number; responseText?: string }).responseText = lastResponseText ?? undefined;
      throw error;
    }

    // Успешный ответ
    return;
  } catch (error) {
    lastError = error instanceof Error ? error : new Error(String(error));

    // Если это сетевой таймаут или другая сетевая ошибка, считаем статус как null
    if (lastError.message.includes("Таймаут") || lastError.message.includes("fetch")) {
      lastStatus = null;
    }

    // Проверяем, нужно ли делать retry
    if (retryCount < MAX_RETRIES && shouldRetry(lastStatus, error)) {
      // Делаем retry
      return sendTelegramRequest(url, body, retryCount + 1);
    }

    // Не делаем retry или превышен лимит retry
    const errorMessage = lastError.message;
    const statusInfo = lastStatus !== null ? ` (HTTP статус: ${lastStatus})` : "";
    const responseInfo = lastResponseText ? ` Ответ: ${lastResponseText.substring(0, 200)}` : "";

    throw new Error(`Ошибка при отправке сообщения в Telegram: ${errorMessage}${statusInfo}${responseInfo}`);
  }
}

/**
 * Отправляет сообщение в Telegram чат.
 *
 * @param text - Текст сообщения (HTML формат)
 * @param threadId - Опциональный ID топика (для форумов)
 * @throws {Error} Если Telegram API вернул ошибку
 */
export async function sendToTelegram(text: string, threadId?: number): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN не задан в переменных окружения");
  }

  if (!chatId) {
    throw new Error("TELEGRAM_CHAT_ID не задан в переменных окружения");
  }

  // Создаем URL без логирования токена
  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
  };

  // Добавляем message_thread_id только если он задан в env или передан явно
  const envThreadId = process.env.TELEGRAM_THREAD_ID;
  if (threadId !== undefined) {
    body.message_thread_id = threadId;
  } else if (envThreadId) {
    const parsedThreadId = Number.parseInt(envThreadId, 10);
    if (!Number.isNaN(parsedThreadId)) {
      body.message_thread_id = parsedThreadId;
    }
  }

  await sendTelegramRequest(url, body);
}
