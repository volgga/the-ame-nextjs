# Настройка Webhook для уведомлений о платежах T-Bank

## Описание

После успешной или неуспешной оплаты T-Bank отправляет уведомление (webhook) на сервер, который обновляет статус заказа и отправляет уведомление в Telegram.

## URL Webhook

**Основной endpoint:** `https://theame.ru/api/tinkoff-callback`

Альтернативный endpoint (если настроен): `https://theame.ru/api/payments/tinkoff/notification`

## Настройка в кабинете T-Bank

1. Войдите в кабинет T-Bank (https://www.tbank.ru/)
2. Перейдите в раздел настроек терминала
3. Найдите настройку "URL для уведомлений" или "Notification URL"
4. Укажите: `https://theame.ru/api/tinkoff-callback`
5. Сохраните настройки

## Переменные окружения

### Обязательные для работы webhook:

- `TINKOFF_TERMINAL_KEY` — ключ терминала T-Bank
- `TINKOFF_PASSWORD` — пароль для подписи уведомлений (используется для проверки подлинности webhook)
- `TELEGRAM_BOT_TOKEN` — токен Telegram бота
- `TELEGRAM_ORDERS_CHAT_ID` — ID чата для уведомлений о заказах

### Опциональные:

- `TINKOFF_NOTIFICATION_URL` — если не задан, используется дефолтный `https://theame.ru/api/tinkoff-callback`
- `TELEGRAM_ORDERS_THREAD_ID` — ID топика в форуме (если используется)

## Как это работает

1. Пользователь оплачивает заказ в T-Bank
2. T-Bank отправляет POST запрос на `/api/tinkoff-callback` с данными о статусе платежа
3. Сервер проверяет подпись уведомления (используя `TINKOFF_PASSWORD`)
4. Сервер обновляет статус заказа в базе данных
5. Сервер отправляет уведомление в Telegram (если еще не отправлялось — идемпотентность)
6. Сервер возвращает `200 OK` с телом `"OK"`

## Проверка работы

### Логирование

Все события логируются с префиксом `[tinkoff-callback]`:

- `received webhook` — получен webhook от T-Bank
- `payment success detected` — обнаружена успешная оплата
- `payment failed detected` — обнаружена неуспешная оплата
- `sending payment success tg` — отправка уведомления об успехе
- `payment success tg sent successfully` — уведомление отправлено
- `payment success tg failed` — ошибка отправки уведомления

### Проверка через логи Vercel

1. Откройте Vercel Dashboard → ваш проект → Functions → Logs
2. Найдите логи с префиксом `[tinkoff-callback]`
3. Проверьте, что webhook приходит и уведомления отправляются

### Тестирование локально

Для локального тестирования используйте ngrok или аналогичный инструмент:

```bash
ngrok http 3000
```

Затем в `.env.local` укажите:
```
TINKOFF_NOTIFICATION_URL=https://your-ngrok-url.ngrok.io/api/tinkoff-callback
```

И в кабинете T-Bank укажите тот же URL.

## Возможные проблемы

### Уведомления не приходят

1. **Проверьте URL в кабинете T-Bank** — должен совпадать с `TINKOFF_NOTIFICATION_URL` (или дефолтным)
2. **Проверьте ENV переменные на проде:**
   - `TINKOFF_PASSWORD` — должен совпадать с паролем в кабинете T-Bank
   - `TELEGRAM_BOT_TOKEN` — должен быть валидным
   - `TELEGRAM_ORDERS_CHAT_ID` — должен быть задан
3. **Проверьте логи Vercel** — ищите ошибки с префиксом `[tinkoff-callback]`
4. **Проверьте подпись** — если `invalid token`, значит `TINKOFF_PASSWORD` неверный

### Уведомления дублируются

Система защищена от дублей через поля `payment_success_notified_at` и `payment_fail_notified_at` в таблице `orders`. Если дубли все равно приходят — проверьте миграцию базы данных.

## Идемпотентность

Система гарантирует, что уведомление в Telegram отправляется только один раз для каждого события (успех/неуспех). Это реализовано через проверку полей `payment_success_notified_at` и `payment_fail_notified_at` перед отправкой.

## Формат уведомлений в Telegram

- **Успешная оплата:** "✅ Оплата успешна" + детали заказа
- **Неуспешная оплата:** "❌ Оплата не прошла" + детали заказа + причина
