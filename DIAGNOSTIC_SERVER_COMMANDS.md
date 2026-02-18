# Команды диагностики на сервере

Выполни эти команды **на сервере** (через SSH), чтобы получить ответы на вопросы диагностики.

## 1. PM2 логи
```bash
pm2 logs theame-next --lines 50
```
**Что искать:** FetchError, 401 Unauthorized, Invalid Key

## 2. Кэш картинок Next.js
```bash
ls -la /var/www/theame/.next/cache/images
```
Если папка пуста — оптимизатор Next.js не может скачать фото из Supabase.

## 3. Деплой и проверка check-db
```bash
cd /var/www/theame  # или путь к проекту на сервере
git pull
npm run build
pm2 reload all --update-env
# Проверь эндпоинт:
curl -s https://theame.ru/api/check-db | jq .
# или
curl -s https://theame.ru/api/check-db
```

## 4. debug-env (проверка переменных)
```bash
curl -s https://theame.ru/api/debug-env | jq .
```
