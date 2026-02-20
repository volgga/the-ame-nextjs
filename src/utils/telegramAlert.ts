/**
 * Чистая утилита для отправки сообщений в Telegram из API routes.
 * Без "use server", без Server Actions — обычный fetch к Telegram Bot API.
 * Используется вебхуками (tinkoff-callback, notification и т.д.) для избежания ошибки
 * "Failed to find Server Action" при вызове из route handlers.
 */

const MAX_MESSAGE_LENGTH = 4096;
const FETCH_TIMEOUT_MS = 10_000;

function truncate(text: string): string {
  if (text.length <= MAX_MESSAGE_LENGTH) return text;
  return text.slice(0, MAX_MESSAGE_LENGTH - 1).trimEnd() + "…";
}

/**
 * Отправляет текст в чат заказов (TELEGRAM_ORDERS_CHAT_ID или TELEGRAM_CHAT_ID).
 * Best-effort: если переменные не заданы — не отправляет и не бросает.
 */
export async function sendTelegramAlert(text: string): Promise<void> {
  const chatId = (
    process.env.TELEGRAM_ORDERS_CHAT_ID?.trim() ||
    process.env.TELEGRAM_CHAT_ID?.trim()
  );
  if (!chatId) {
    console.warn("[sendTelegramAlert] TELEGRAM_ORDERS_CHAT_ID and TELEGRAM_CHAT_ID not set, skipping");
    return;
  }

  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) {
    console.error("[sendTelegramAlert] TELEGRAM_BOT_TOKEN not set");
    throw new Error("TELEGRAM_BOT_TOKEN не задан");
  }

  const threadIdEnv = process.env.TELEGRAM_ORDERS_THREAD_ID || process.env.TELEGRAM_THREAD_ID;
  const threadId = threadIdEnv != null ? Number.parseInt(String(threadIdEnv).trim(), 10) || undefined : undefined;

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const body: Record<string, unknown> = {
    chat_id: chatId.trim(),
    text: truncate(text),
    parse_mode: "HTML",
  };
  if (threadId != null && !Number.isNaN(threadId)) {
    body.message_thread_id = threadId;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; description?: string };
    if (!data.ok) {
      console.error("[sendTelegramAlert] Telegram API error", {
        status: res.status,
        description: data.description,
      });
      throw new Error(data.description ?? `HTTP ${res.status}`);
    }
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Таймаут запроса к Telegram API (${FETCH_TIMEOUT_MS}ms)`);
    }
    throw err;
  }
}
