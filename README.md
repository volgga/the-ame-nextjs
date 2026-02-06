# The Ame

Сайт магазина цветов: каталог, корзина, заказ, оплата. Next.js, Supabase.

Лицензия и контакты — по запросу.

## Telegram notifications (local)

### Переменные окружения

Для работы уведомлений в Telegram нужны следующие переменные в `.env.local`:

```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
TELEGRAM_THREAD_ID=optional_thread_id_for_forums
```

- `TELEGRAM_BOT_TOKEN` — токен бота, полученный от [@BotFather](https://t.me/BotFather)
- `TELEGRAM_CHAT_ID` — ID чата или группы, куда будут отправляться уведомления
- `TELEGRAM_THREAD_ID` — опциональный ID топика (для форумов), если не задан — сообщения отправляются в основной чат

### Как узнать TELEGRAM_CHAT_ID

#### Для личных чатов (бот пишет вам в личку)

1. Напишите боту любое сообщение в личку
2. Вызовите API метод `getUpdates`:
   ```bash
   curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates"
   ```
3. В ответе найдите `"chat":{"id":123456789}` — это и есть ваш `TELEGRAM_CHAT_ID`

**Важно:** Для получения updates боту нужен webhook или polling, но для отправки сообщений это не требуется. Если `getUpdates` возвращает пустой массив, временно напишите боту в личку, чтобы получить chat_id для личного чата.

#### Для групп

1. Добавьте бота в группу или упомяните его в сообщении
2. Вызовите `getUpdates`:
   ```bash
   curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates"
   ```
3. Найдите `"chat":{"id":-123456789}` (для групп ID отрицательный) — это `TELEGRAM_CHAT_ID` группы

**Примечание:** Если бот не получает сообщения в группе, это нормально — для получения updates нужен webhook/polling. Но для отправки сообщений в группу достаточно знать chat_id. Можно получить его через `getUpdates` после того, как бот был упомянут или добавлен в группу.

### Тестирование

После настройки переменных окружения можно протестировать отправку уведомлений через curl:

#### Тест формы "Купить в 1 клик"

```bash
curl -X POST http://localhost:3000/api/forms/one-click \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+79991234567",
    "name": "Иван Иванов",
    "productTitle": "Букет роз",
    "pageUrl": "/product/bouquet-roses"
  }'
```

#### Тест формы "Заказать букет"

```bash
curl -X POST http://localhost:3000/api/forms/bouquet \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+79991234567",
    "name": "Мария Петрова",
    "message": "Нужен букет на день рождения",
    "pageUrl": "/"
  }'
```

#### Тест формы "Намекнуть о подарке"

```bash
curl -X POST http://localhost:3000/api/forms/gift-hint \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+79991234567",
    "name": "Алексей Сидоров",
    "recipientName": "Анна",
    "preferredDate": "2026-02-14",
    "comment": "Романтический букет",
    "pageUrl": "/product/romantic-bouquet"
  }'
```

Успешный ответ:
```json
{"ok": true}
```

Ответ с ошибкой:
```json
{"ok": false, "error": "Описание ошибки"}
```
