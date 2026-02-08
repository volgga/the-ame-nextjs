# Аудит Telegram и форм (cleanup)

## Изменённые файлы

| Файл | Изменения |
|------|-----------|
| `src/lib/telegram.ts` | Единая `sendTelegramMessage({ chatId, threadId?, text })`, таймаут 10s, 1 retry только на 5xx/сеть, обрезка текста до 4096 символов с "…", `sendToTelegram` — обёртка над env |
| `src/lib/format.ts` | Уже приведён к требованиям: buildAbsoluteUrl, escapeHtml, без Страница/Lead ID/ID товара в сообщениях |
| `src/lib/leadEvents.ts` | Лог при неудачной записи события: `console.error` с типом события и текстом ошибки |
| `src/app/api/forms/one-click/route.ts` | Best-effort: при падении TG возвращаем 200 ok, логируем tg_failed; компактные console.error |
| `src/app/api/forms/bouquet/route.ts` | То же |
| `src/app/api/forms/gift-hint/route.ts` | То же |
| `src/components/product/GiftHintModal.tsx` | Удалён console.log payload |
| `src/components/cart/QuickBuyModal.tsx` | Удалён console.log payload |
| `src/components/home/OrderBouquetSection.tsx` | Удалён console.log payload |
| `docs/SECURITY.md` | Новый: секреты, .gitignore, проверка истории, переписывание истории (рекомендации) |
| `scripts/tg-test.ts` | Новый: smoke-тест отправки в TG (токен не в выводе) |
| `scripts/forms-test.ts` | Новый: 3 POST на /api/forms/* для smoke-теста |
| `package.json` | Скрипты `tg-test`, `forms-test` |

## Удалено

- `src/app/api/telegram-debug/route.ts` — временный отладочный endpoint (логировал тело запроса).

## Проверено

- **Секреты**: в коде только чтение `process.env.TELEGRAM_BOT_TOKEN` / `SUPABASE_SERVICE_ROLE_KEY`; токены не логируются. `.env*` в .gitignore, `.env.example` есть.
- **Supabase**: вставка в `leads` (id, type, name, phone, payload, page_url) и в `lead_events` соответствует миграциям; `productUrl`/`productPath` хранятся в `payload` (jsonb).
- **Формы**: honeypot возвращает ok:true без отправки; rate limit — 429; валидация — 400; при ошибке TG — 200 ok + запись tg_failed в lead_events.
- **Линт и сборка**: `npm run lint` и `npm run build` проходят.

## Запуск smoke-тестов

```bash
# Telegram (нужны TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в env)
npm run tg-test

# Формы (нужен запущенный dev-сервер)
npm run dev   # в другом терминале
npm run forms-test
# или с другим base: npx tsx scripts/forms-test.ts https://localhost:3000
```
