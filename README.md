# The Ame

Сайт магазина цветов: каталог, корзина, заказ, оплата. Next.js, Supabase.

Лицензия и контакты — по запросу.

## Админ-панель (вход по логину/паролю)

Сессия не сохраняется при закрытии вкладки/выходе с сайта — при следующем заходе снова нужен логин.

### Пошаговая настройка (сделать руками)

1. **Пароль в открытом виде хранить нельзя.** В `.env.local` не должно быть строки с паролем (ни `ADMIN_PASSWORD=...`, ни `ADMIN_PASSWORD_PLAIN=...` после настройки). В env хранятся только логин, bcrypt-хеш пароля и секрет сессии.

2. **Сгенерировать bcrypt-хеш пароля** — одна команда (подставьте свой пароль только в этой команде, в репозиторий не попадает):
   ```bash
   ADMIN_PASSWORD_PLAIN=lol1006kek0907 node scripts/hash-admin-password.mjs
   ```
   Скопировать вывод (одна строка, начинается с `$2b$10$...`) — это значение для `ADMIN_PASSWORD_HASH`.

3. **В `.env.local` для админки должны быть только эти три переменные:**
   ```env
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD_HASH=$2b$10$...   # вставить результат команды из п.2
   ADMIN_SESSION_SECRET=...         # случайная строка 32+ символов (например: openssl rand -base64 32)
   ```

4. **Удалить из `.env.local` строку с паролем в открытом виде**, если она есть:
   - `ADMIN_PASSWORD=...` — удалить полностью.
   - `ADMIN_PASSWORD_PLAIN=...` — после подстановки хеша в `ADMIN_PASSWORD_HASH` тоже удалить.

5. В коде пароль нигде не захардкожен: проверка входа только через `bcrypt.compare` с `ADMIN_PASSWORD_HASH` из env.

6. Проверка: `npm run dev` → открыть http://localhost:3000/admin → редирект на `/admin/login` → ввести логин `admin` и пароль → попасть в `/admin`. После этого логин работает локально.

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

### Если приходит 500 internal_error

1. **Таблицы в Supabase** — выполните миграции в SQL Editor:
   - `scripts/migrations/create-leads-table.sql`
   - `scripts/migrations/create-lead-events-table.sql`
2. **Переменные** — в `.env.local` должны быть заданы: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
3. **Токен бота** — скопируйте его из @BotFather без лишних символов (часто опечатка в конце: `9ZBYs` vs `9ZBs`).
4. **Логи** — в терминале, где запущен `npm run dev`, смотрите сообщения вида `[forms/one-click] Ошибка Telegram:` — там будет причина.
