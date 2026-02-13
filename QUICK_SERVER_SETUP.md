# Быстрая настройка ENV переменных на сервере

## Способ 1: Автоматический скрипт (самый простой)

1. **Подключитесь к серверу:**
   ```bash
   ssh root@94.103.84.28
   # Пароль: h5==5qiRN3=54VVieep_
   ```

2. **Перейдите в директорию проекта:**
   ```bash
   cd /var/www/theame
   ```

3. **Обновите код (чтобы получить скрипт):**
   ```bash
   git pull origin main
   ```

4. **Запустите скрипт:**
   ```bash
   bash scripts/setup-server-env.sh
   ```

Скрипт автоматически:
- Создаст файл `.env.production` с переменными
- Загрузит переменные в окружение
- Перезапустит PM2 процесс
- Покажет результат

## Способ 2: Вручную через .env.production

1. **Подключитесь к серверу:**
   ```bash
   ssh root@94.103.84.28
   ```

2. **Создайте файл .env.production:**
   ```bash
   cd /var/www/theame
   nano .env.production
   ```

3. **Вставьте содержимое** (замените значения на реальные из вашего .env.local):
   ```bash
   SITE_URL=https://theame.ru
   NEXT_PUBLIC_SITE_URL=https://theame.ru
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
   TINKOFF_TERMINAL_KEY=your_tinkoff_terminal_key_here
   TINKOFF_PASSWORD=your_tinkoff_password_here
   TINKOFF_NOTIFICATION_URL=https://theame.ru/api/tinkoff-callback
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
   TELEGRAM_CHAT_ID=your_telegram_chat_id_here
   TELEGRAM_THREAD_ID=your_telegram_thread_id_here
   TELEGRAM_ORDERS_CHAT_ID=your_telegram_orders_chat_id_here
   TELEGRAM_ORDERS_THREAD_ID=your_telegram_orders_thread_id_here
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD_HASH=your_admin_password_hash_here
   ADMIN_SESSION_SECRET=your_admin_session_secret_here
   ```

4. **Сохраните:** `Ctrl+O`, `Enter`, `Ctrl+X`

5. **Загрузите переменные и перезапустите PM2:**
   ```bash
   export $(cat .env.production | grep -v '^#' | xargs)
   git pull origin main
   pm2 restart nextjs-project
   pm2 save
   ```

## Способ 3: Одна команда (если скрипт уже на сервере)

Если вы уже обновили код на сервере:

```bash
ssh root@94.103.84.28 "cd /var/www/theame && bash scripts/setup-server-env.sh"
```

## Проверка после настройки

```bash
# Проверьте что переменные загрузились
pm2 env nextjs-project | grep TELEGRAM

# Проверьте диагностический endpoint
curl https://theame.ru/api/payments/tinkoff/notify/check

# Проверьте логи
pm2 logs nextjs-project --lines 20
```

## Что дальше?

После настройки переменных:
1. Сделайте тестовый заказ
2. Проверьте что уведомление приходит в Telegram
3. Если не работает — проверьте логи: `pm2 logs nextjs-project`
