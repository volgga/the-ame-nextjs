# ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ - Выполните на сервере

## Одна команда для исправления всего:

```bash
cd /var/www/theame && pm2 stop nextjs-project && pm2 delete nextjs-project && export $(cat .env.production | grep -v '^#' | xargs) && rm -rf .next && npm run build && pm2 start ecosystem.config.js && pm2 save && sleep 3 && curl https://theame.ru/api/payments/tinkoff/notify/check
```

## Или по шагам:

```bash
cd /var/www/theame

# 1. Остановите PM2
pm2 stop nextjs-project
pm2 delete nextjs-project

# 2. Загрузите переменные
export $(cat .env.production | grep -v '^#' | xargs)

# 3. Удалите старую сборку
rm -rf .next

# 4. Пересоберите проект
npm run build

# 5. Запустите PM2
pm2 start ecosystem.config.js
pm2 save

# 6. Проверьте
curl https://theame.ru/api/payments/tinkoff/notify/check
```

Должно вернуть: `"envAllSet":true`
