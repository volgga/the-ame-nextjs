# Исправление 404 на _next/static после деплоя

## Диагноз

Ошибки 404 для `/_next/static/chunks/*` и шрифтов возникают, когда **билд не совпадает с запросами браузера**. Возможные причины:

### 1. Несоответствие путей Nginx (наиболее вероятно)

Проект использует `output: "standalone"`. PM2 запускает приложение из `.next/standalone/`, а статика обслуживается оттуда же.

**Важно:** Nginx сейчас указывает `alias /var/www/theame/.next/static/`, но при standalone-сборке статика фактически живёт в `.next/standalone/.next/static/`. Оба пути должны содержать одни и те же файлы после `npm run build`, но для надёжности лучше использовать путь standalone, т.к. это каноничное место запуска приложения.

### 2. Кэш HTML с устаревшими хэшами чанков

Браузер или CDN могут кэшировать старый HTML, который ссылается на `chunks/abc123.js`. После пересборки хэш меняется на `chunks/xyz789.js`. Запрос старого файла → 404.

**Решение:** после пересборки — очистить кэш браузера (Ctrl+Shift+R) или добавить cache-control для HTML.

### 3. Неверное имя PM2-приложения в deploy.sh

`deploy.sh` по умолчанию перезапускает `nextjs-project`, а в `ecosystem.config.cjs` приложение называется `theame-next`. Нужно выровнять имена.

---

## План действий

### Этап 1: Локальная чистка (выполнено)

- Удалены/исправлены: лишние скрипты, page.tsx (DEBUG), package.json (fix-visibility/diagnose), Nginx-конфиг

### Этап 2: Сервер (выполнить вручную)

1. **Подключиться по SSH:**
   ```bash
   ssh root@147.45.245.220
   ```

2. **Запустить скрипт исправления (рекомендуется):**
   ```bash
   cd /var/www/theame
   git pull
   bash scripts/server-fix-404.sh
   ```
   Скрипт: очищает .next, собирает, копирует static/public в standalone, применяет Nginx, перезапускает PM2.

3. **Или вручную:**
   ```bash
   cd /var/www/theame
   rm -rf .next
   npm ci
   npm run build
   cp -r .next/static .next/standalone/.next/
   cp -r public .next/standalone/
   ```

4. **Проверить, что статика на месте:**
   ```bash
   ls -la .next/static/chunks/ | head -5
   ls -la .next/standalone/.next/static/chunks/ | head -5
   ```

5. **Обновить Nginx (если скрипт не применил автоматически):**
   - Применить конфиг из `scripts/nginx-theame-fixed.conf` (HTTP + HTTPS)
   - Убедиться, что `location /_next/static/` указывает на:
     ```
     alias /var/www/theame/.next/standalone/.next/static/;
     ```
   - Перезагрузить Nginx: `nginx -t && systemctl reload nginx`

   Убедитесь, что конфиг активен: `ls -la /etc/nginx/sites-enabled/` должен содержать ссылку на theame.

6. **Перезапустить PM2:**
   ```bash
   pm2 restart theame-next --update-env
   pm2 save
   ```

7. **Проверить доступность:**
   ```bash
   curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
   curl -s -o /dev/null -w "%{http_code}" https://theame.ru/
   ```

8. **Очистить кэш браузера** (Ctrl+Shift+R) и проверить консоль на 404.

---

## Структура файлов после standalone-сборки

```
/var/www/theame/
├── .next/
│   ├── static/                    ← можно использовать для Nginx
│   │   ├── chunks/
│   │   ├── css/
│   │   └── media/
│   └── standalone/
│       ├── server.js
│       ├── .next/
│       │   └── static/            ← предпочтительный путь для Nginx
│       ├── public/
│       └── node_modules/
├── public/
├── package.json
└── ...
```

**Важно:** Next.js не всегда копирует `static` и `public` в standalone автоматически. Скрипты `deploy.sh` и `server-fix-404.sh` выполняют явное копирование после `npm run build`.
