# Запуск на VPS (VDSina и др.)

## Почему сайт может «лечь» через некоторое время

- Один процесс Node обрабатывает все запросы. При падении (OOM, необработанное исключение) сервер перестаёт отвечать → **ERR_TIMED_OUT**.
- Админка грузит много данных (товары, категории). Одновременно с открытием сайта с телефона это может дать пик нагрузки и падение.

## Что сделано в коде

- В middleware при ошибке проверки сессии админки делается редирект на логин, а не падение процесса.
- Ревалидация страниц категорий ослаблена (300 сек вместо 60), чтобы снизить нагрузку.

## Как включить логи и автоперезапуск (PM2)

1. Установить PM2 (один раз):
   ```bash
   npm install -g pm2
   ```

2. В папке проекта создать папку для логов:
   ```bash
   mkdir -p logs
   ```

3. Запустить приложение через PM2 (обязательно из корня проекта):
   ```bash
   cd /path/to/nextjs-project
   pm2 start ecosystem.config.cjs
   ```
   Если PM2 пишет «File ecosystem.config.cjs not found» — ты не в корне проекта. Перейди в папку, где лежат `package.json` и `ecosystem.config.cjs`, затем снова выполни `pm2 start ecosystem.config.cjs`. Либо укажи полный путь: `pm2 start $(pwd)/ecosystem.config.cjs`.

4. Сохранить список процессов, чтобы после перезагрузки сервера PM2 сам поднял приложение:
   ```bash
   pm2 save
   pm2 startup
   ```

Дальше:
- **Логи в реальном времени:** `pm2 logs`
- **Логи в файлах:** `logs/out.log`, `logs/err.log`
- **Статус:** `pm2 status`
- **Перезапуск:** `pm2 restart theame-next`

При падении процесса PM2 перезапустит его сам (`autorestart: true`). В логах будет видно момент падения и стек ошибки.

## Если PM2 не ставите

Запуск вручную с записью логов:
```bash
npm run build && npm run start 2>&1 | tee -a logs/server.log
```
При падении процесса сайт снова будет недоступен, пока не перезапустите команду.

## 502 Bad Gateway — что делать

Nginx отдаёт 502, когда приложение (Node/Next) не отвечает на порту 3000. Выполни **на VPS по SSH**:

```bash
# Найти папку проекта (где package.json и ecosystem.config.cjs)
cd $(find /var/www /root -maxdepth 4 -name "ecosystem.config.cjs" 2>/dev/null | head -1 | xargs dirname)

# Подтянуть код (если нужно)
git pull

# Перезапустить приложение через PM2
pm2 delete all 2>/dev/null; mkdir -p logs; pm2 start "$(pwd)/ecosystem.config.cjs"; pm2 save

# Проверка
pm2 status
curl -s -o /dev/null -w "localhost:3000 → HTTP %{http_code}\n" http://localhost:3000
```

Если `curl` даёт 200 — обнови страницу theame.ru. Если PM2 не установлен: `npm install -g pm2` и снова команды выше. Полный деплой (build + PM2): `bash scripts/deploy-vps-remote.sh` из корня проекта.

## Проверка памяти на VPS

```bash
free -h
```
Если RAM меньше 1 GB, возможны падения под нагрузкой. Рекомендуется минимум 1 GB для Next.js в production.
