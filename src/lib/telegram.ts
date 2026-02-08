/**
 * Отправка сообщений в Telegram через Bot API.
 * Единая функция sendTelegramMessage, таймаут, 1 retry на 5xx/сеть, лимит длины.
 */

export interface SendTelegramOptions {
  chatId: string;
  threadId?: number;
  text: string;
}

interface TelegramResponse {
  ok: boolean;
  description?: string;
  error_code?: number;
  result?: unknown;
}

const FETCH_TIMEOUT_MS = 10_000; // 10 секунд
const MAX_RETRIES = 1;
const MAX_MESSAGE_LENGTH = 4096; // лимит Telegram API

/**
 * Урезает текст до лимита и добавляет "…" при обрезке.
 */
function truncateForTelegram(text: string): string {
  if (text.length <= MAX_MESSAGE_LENGTH) return text;
  return text.slice(0, MAX_MESSAGE_LENGTH - 1).trimEnd() + "…";
}

/**
 * Fetch с таймаутом (AbortController).
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
 * Retry только на сетевые ошибки и 5xx. Не ретраить 4xx.
 */
function shouldRetry(status: number | null): boolean {
  if (status !== null && status >= 400 && status < 500) return false;
  return true;
}

async function sendTelegramRequest(
  url: string,
  body: Record<string, unknown>,
  retryCount = 0
): Promise<void> {
  let lastError: Error | null = null;
  let lastStatus: number | null = null;
  let lastResponseText: string | null = null;

  try {
    const response = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      data = {
        ok: false,
        description: `Неверный формат ответа (статус: ${response.status})`,
      };
    }

    if (!data.ok) {
      const desc = data.description ?? `код ${data.error_code ?? "unknown"}, HTTP ${response.status}`;
      const err = new Error(desc) as Error & { status?: number; responseText?: string };
      err.status = response.status;
      err.responseText = lastResponseText ?? undefined;
      throw err;
    }
    return;
  } catch (error) {
    lastError = error instanceof Error ? error : new Error(String(error));
    if (lastError.message.includes("Таймаут") || lastError.message.includes("fetch")) {
      lastStatus = null;
    }

    if (retryCount < MAX_RETRIES && shouldRetry(lastStatus)) {
      return sendTelegramRequest(url, body, retryCount + 1);
    }

    const statusInfo = lastStatus != null ? ` (HTTP ${lastStatus})` : "";
    const responseInfo = lastResponseText ? ` Ответ: ${lastResponseText.slice(0, 200)}` : "";
    throw new Error(
      `Telegram: ${lastError.message}${statusInfo}${responseInfo}`
    );
  }
}

/**
 * Единая функция отправки в Telegram.
 * parse_mode=HTML. Текст обрезается до 4096 символов при необходимости.
 * Токен не логируется.
 */
export async function sendTelegramMessage(options: SendTelegramOptions): Promise<void> {
  const { chatId, threadId, text } = options;
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN не задан");
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text: truncateForTelegram(text),
    parse_mode: "HTML",
  };
  if (threadId != null) {
    body.message_thread_id = threadId;
  }

  await sendTelegramRequest(url, body);
}

/**
 * Отправляет сообщение в чат из env (TELEGRAM_CHAT_ID, опционально TELEGRAM_THREAD_ID).
 * Удобная обёртка для форм.
 */
export async function sendToTelegram(text: string, threadId?: number): Promise<void> {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) {
    throw new Error("TELEGRAM_CHAT_ID не задан");
  }
  const envTid = process.env.TELEGRAM_THREAD_ID;
  const parsedTid = envTid ? Number.parseInt(envTid, 10) : undefined;
  const resolvedThreadId = threadId ?? (parsedTid !== undefined && !Number.isNaN(parsedTid) ? parsedTid : undefined);
  await sendTelegramMessage({
    chatId,
    threadId: resolvedThreadId,
    text,
  });
}
