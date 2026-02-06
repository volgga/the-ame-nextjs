/**
 * Отправка сообщений в Telegram через Bot API.
 */

interface TelegramResponse {
  ok: boolean;
  description?: string;
  error_code?: number;
  result?: unknown;
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

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as TelegramResponse;

    if (!data.ok) {
      const errorMessage = data.description || `Telegram API вернул ошибку (код: ${data.error_code || "unknown"})`;
      throw new Error(errorMessage);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Ошибка при отправке сообщения в Telegram: ${String(error)}`);
  }
}
