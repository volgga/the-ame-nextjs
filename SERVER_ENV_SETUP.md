# Настройка ENV переменных на сервере (94.103.84.28)

## Вариант 1: Через ecosystem.config.js (рекомендуется)

Файл `ecosystem.config.js` уже обновлен для поддержки ENV переменных из системного окружения.

### Шаги:

1. **Подключитесь к серверу по SSH:**
   ```bash
   ssh root@94.103.84.28
   # Пароль: h5==5qiRN3=54VVieep_
   ```

2. **Перейдите в директорию проекта:**
   ```bash
   cd /var/www/theame
   ```

3. **Создайте файл `.env.production` с переменными:**
   ```bash
   nano .env.production
   ```
   
   Вставьте следующее содержимое (замените значения на ваши реальные):
   ```bash
   # Supabase (замените на ваши реальные значения)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
   
   # Tinkoff (T-Bank)
   TINKOFF_TERMINAL_KEY=1754488339859
   TINKOFF_PASSWORD=Njtk41vKKN3yi58i
   TINKOFF_NOTIFICATION_URL=https://theame.ru/api/tinkoff-callback
   
   # Telegram Bot API
   TELEGRAM_BOT_TOKEN=8210290619:AAEXbzbTbkcR5pH-gsondkTRa165ie9ZBYs
   TELEGRAM_CHAT_ID=-1002343550030
   TELEGRAM_THREAD_ID=3766
   TELEGRAM_ORDERS_CHAT_ID=-1002343550030
   TELEGRAM_ORDERS_THREAD_ID=1947
   
   # Admin
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD_HASH=\$2b\$10\$s/tjvnZr1vq0KCcvBN5G1eVVd/eGFYGnRNWVLnE2GT1hc4sTx1a0e
   ADMIN_SESSION_SECRET=7sdf98sdf7sdf9
   ```
   
   Сохраните файл: `Ctrl+O`, затем `Enter`, затем `Ctrl+X`

4. **Обновите код из репозитория (чтобы получить обновленный ecosystem.config.js):**
   ```bash
   git pull origin main
   ```

5. **Загрузите переменные из .env.production в текущую сессию:**
   ```bash
   export $(cat .env.production | grep -v '^#' | xargs)
   ```

6. **Перезапустите PM2 процесс:**
   ```bash
   pm2 restart nextjs-project
   pm2 save
   ```

7. **Проверьте что переменные загрузились:**
   ```bash
   pm2 env nextjs-project
   ```

## Вариант 2: Через системные ENV переменные (более надежно)

Если хотите чтобы переменные были доступны системно:

1. **Подключитесь к серверу:**
   ```bash
   ssh root@94.103.84.28
   ```

2. **Отредактируйте файл с переменными окружения:**
   ```bash
   nano /etc/environment
   ```
   
   Добавьте в конец файла (каждую переменную на новой строке):
   ```bash
   NEXT_PUBLIC_SUPABASE_URL="your_supabase_url_here"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key_here"
   SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key_here"
   TINKOFF_TERMINAL_KEY="1754488339859"
   TINKOFF_PASSWORD="Njtk41vKKN3yi58i"
   TINKOFF_NOTIFICATION_URL="https://theame.ru/api/tinkoff-callback"
   TELEGRAM_BOT_TOKEN="8210290619:AAEXbzbTbkcR5pH-gsondkTRa165ie9ZBYs"
   TELEGRAM_CHAT_ID="-1002343550030"
   TELEGRAM_THREAD_ID="3766"
   TELEGRAM_ORDERS_CHAT_ID="-1002343550030"
   TELEGRAM_ORDERS_THREAD_ID="1947"
   ADMIN_USERNAME="admin"
   ADMIN_PASSWORD_HASH="\$2b\$10\$s/tjvnZr1vq0KCcvBN5G1eVVd/eGFYGnRNWVLnE2GT1hc4sTx1a0e"
   ADMIN_SESSION_SECRET="7sdf98sdf7sdf9"
   ```
   
   Сохраните: `Ctrl+O`, `Enter`, `Ctrl+X`

3. **Перезагрузите переменные окружения:**
   ```bash
   source /etc/environment
   ```

4. **Перезапустите PM2:**
   ```bash
   cd /var/www/theame
   pm2 restart nextjs-project
   pm2 save
   ```

## Вариант 3: Через PM2 ecosystem напрямую (быстрый способ)

Если нужно быстро добавить переменные без перезагрузки системы:

1. **Подключитесь к серверу:**
   ```bash
   ssh root@94.103.84.28
   cd /var/www/theame
   ```

2. **Отредактируйте ecosystem.config.js:**
   ```bash
   nano ecosystem.config.js
   ```
   
   Найдите секцию `env:` и замените значения на реальные (без `process.env.`):
   ```javascript
   env: {
     NODE_ENV: "production",
     PORT: "3000",
     SITE_URL: "https://theame.ru",
     NEXT_PUBLIC_SITE_URL: "https://theame.ru",
     
     // Supabase (замените на ваши реальные значения)
     NEXT_PUBLIC_SUPABASE_URL: "your_supabase_url_here",
     NEXT_PUBLIC_SUPABASE_ANON_KEY: "your_supabase_anon_key_here",
     SUPABASE_SERVICE_ROLE_KEY: "your_supabase_service_role_key_here",
     
     // Tinkoff
     TINKOFF_TERMINAL_KEY: "1754488339859",
     TINKOFF_PASSWORD: "Njtk41vKKN3yi58i",
     TINKOFF_NOTIFICATION_URL: "https://theame.ru/api/tinkoff-callback",
     
     // Telegram
     TELEGRAM_BOT_TOKEN: "8210290619:AAEXbzbTbkcR5pH-gsondkTRa165ie9ZBYs",
     TELEGRAM_CHAT_ID: "-1002343550030",
     TELEGRAM_THREAD_ID: "3766",
     TELEGRAM_ORDERS_CHAT_ID: "-1002343550030",
     TELEGRAM_ORDERS_THREAD_ID: "1947",
     
     // Admin
     ADMIN_USERNAME: "admin",
     ADMIN_PASSWORD_HASH: "\\$2b\\$10\\$s/tjvnZr1vq0KCcvBN5G1eVVd/eGFYGnRNWVLnE2GT1hc4sTx1a0e",
     ADMIN_SESSION_SECRET: "7sdf98sdf7sdf9",
   }
   ```
   
   Сохраните: `Ctrl+O`, `Enter`, `Ctrl+X`

3. **Перезапустите PM2:**
   ```bash
   pm2 restart ecosystem.config.js
   pm2 save
   ```

## Проверка после настройки

1. **Проверьте что переменные загрузились:**
   ```bash
   pm2 env nextjs-project | grep TELEGRAM
   ```

2. **Проверьте диагностический endpoint:**
   ```bash
   curl https://theame.ru/api/payments/tinkoff/notify/check
   ```
   
   Должно вернуть JSON с `"envAllSet": true`

3. **Проверьте логи PM2:**
   ```bash
   pm2 logs nextjs-project --lines 50
   ```

4. **Сделайте тестовый заказ** и проверьте что уведомление приходит в Telegram

## Важно!

⚠️ **Безопасность:**
- Файл `.env.production` должен быть в `.gitignore` (уже добавлен)
- Не коммитьте реальные значения токенов в Git
- После настройки можно удалить этот файл с инструкциями

⚠️ **После изменений:**
- Всегда перезапускайте PM2: `pm2 restart nextjs-project`
- Сохраняйте конфигурацию: `pm2 save`

## Быстрая команда для копирования

Если хотите быстро выполнить все шаги одной командой:

```bash
ssh root@94.103.84.28 "cd /var/www/theame && git pull origin main && pm2 restart nextjs-project && pm2 save"
```

Но сначала нужно настроить переменные через один из вариантов выше.
