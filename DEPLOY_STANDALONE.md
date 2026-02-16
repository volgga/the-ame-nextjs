# Деплой Next.js standalone на VPS

Проект настроен на сборку в режиме `output: "standalone"`. Это уменьшает размер деплоя (нет полного `node_modules` на сервере).

## Сборка

На машине с Node.js и npm (рекомендуется Linux — для корректной работы sharp на VPS):

```bash
bash scripts/build-standalone.sh
```

Скрипт:

1. Выполняет `npm ci` (или `npm install`)
2. Запускает `npm run build`
3. Копирует `public` и `.next/static` в `.next/standalone/`
4. Копирует скрипт запуска
5. Создаёт архив `deploy-standalone.tar.gz`

## Что копировать на сервер

- `deploy-standalone.tar.gz` — единственный файл

## Распаковка и запуск на сервере

```bash
# Распаковать в целевой каталог
tar -xzf deploy-standalone.tar.gz -C /var/www/theame

# Перейти в каталог
cd /var/www/theame

# Запуск
bash run-standalone.sh
```

Или напрямую:

```bash
cd /var/www/theame
NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 node server.js
```

## Запуск через PM2

```bash
cd /var/www/theame
pm2 delete theame || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Логи PM2 пишет в `logs/err.log` и `logs/out.log` (не в journald).

Для мониторинга памяти: `pm2 monit`

Переменные окружения задайте в `.env` в каталоге приложения.

## Переменные окружения

На сервере должны быть заданы все переменные из `.env.local` (Supabase, Telegram, Tinkoff и т.д.). Рекомендуется создать файл `.env` в `/var/www/theame/` или использовать `pm2 env`.

## Примечание

- Сборку лучше выполнять на той же ОС, что и сервер (Linux), чтобы sharp работал корректно
- На VPS 1GB RAM билд может не пройти — используйте CI или более мощную машину для сборки
