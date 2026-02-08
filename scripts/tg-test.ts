/**
 * Smoke-тест отправки одного сообщения в Telegram.
 * Запуск: TELEGRAM_BOT_TOKEN=... TELEGRAM_CHAT_ID=... npx tsx scripts/tg-test.ts
 * Токен в вывод не попадает.
 */

import "dotenv/config";

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token) {
    console.error("TELEGRAM_BOT_TOKEN не задан");
    process.exit(1);
  }
  if (!chatId) {
    console.error("TELEGRAM_CHAT_ID не задан");
    process.exit(1);
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const body = {
    chat_id: chatId,
    text: "🧪 [tg-test] Smoke test " + new Date().toISOString(),
    parse_mode: "HTML",
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    const data = JSON.parse(text || "{}") as { ok?: boolean; description?: string };

    if (data.ok) {
      console.log("OK: сообщение отправлено");
      return;
    }
    console.error("Ошибка Telegram:", data.description ?? text.slice(0, 200));
    process.exit(1);
  } catch (e) {
    console.error("Ошибка запроса:", e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}

main();
