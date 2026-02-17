# Деплой (GitHub Actions)

При `git push origin main` workflow подключается по SSH к серверу, обновляет код, собирает и перезапускает PM2.

## GitHub Secrets

- `DEPLOY_HOST` — IP или домен сервера
- `DEPLOY_USER` — пользователь SSH
- `DEPLOY_SSH_KEY` — приватный SSH ключ (без passphrase)
- `DEPLOY_PATH` — путь к проекту на сервере (например `/var/www/theame`)
- `DEPLOY_PORT` — порт SSH (по умолчанию 22)

## Сервер (один раз)

Node.js 20, PM2, клонировать репо в `DEPLOY_PATH`. Публичный ключ деплоя в `~/.ssh/authorized_keys`. Затем:

```bash
cd $DEPLOY_PATH && npm ci && npm run build && pm2 start ecosystem.config.cjs && pm2 save && pm2 startup
```

Имя процесса в `ecosystem.config.cjs` — по умолчанию `nextjs-project`.

## Ручной деплой на сервере

```bash
cd $DEPLOY_PATH && bash scripts/deploy.sh
# или с авто-поиском проекта: bash scripts/deploy-vps-remote.sh
```

## Standalone-сборка (опционально)

При `output: "standalone"` можно собрать архив без полного `node_modules`:

```bash
bash scripts/build-standalone.sh
# → deploy-standalone.tar.gz
```

На сервере: распаковать в `DEPLOY_PATH`, затем `pm2 start ecosystem.config.js`. Переменные окружения — в `.env` в каталоге приложения.

## Проблемы

- PM2 не найден → `npm install -g pm2`; процесс не перезапускается → `pm2 list`, при необходимости `pm2 start ecosystem.config.cjs`
- SSH → ключ в Secrets целиком (с BEGIN/END), публичный ключ в `authorized_keys`, `chmod 600`
- Сборка → логи в Actions, на сервере `node --version` (20), `npm ci`
