# Безопасность: формы, Telegram, Supabase

## Секреты и переменные окружения

- **Не коммитить**: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`, ключи Tinkoff и любые секреты. Пароль админки в открытом виде хранить нельзя — только bcrypt-хеш в `ADMIN_PASSWORD_HASH`.
- **`.env.local`** должен быть в `.gitignore` (в проекте используется правило `.env*` с исключением `!.env.example`).
- **`.env.example`** — шаблон без значений секретов; коммитить можно.

## Проверка утечек в истории Git

Если секреты когда-либо попали в коммиты:

1. **Проверить историю** (без изменения репозитория):
   ```bash
   git log -p --all -- .env* '*.env*' 2>/dev/null
   git log -p -S "TELEGRAM_BOT_TOKEN" -- "*.ts" "*.tsx" "*.js"
   ```

2. **Если найдены утечки** — перевыпустить все затронутые ключи (Telegram Bot Token, Supabase Service Role Key и т.д.) в соответствующих сервисах.

3. **Переписать историю** (destructive, выполнять только при необходимости и с бэкапом):
   - Инструменты: [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/), [git-filter-repo](https://github.com/newren/git-filter-repo).
   - Пример (BFG): создать файл `secrets.txt` со строками для удаления, затем `bfg --replace-text secrets.txt`.
   - После переписывания истории все разработчики должны выполнить `git fetch && git reset --hard origin/main` (или аналог). **Автоматически эти действия в проекте не выполняются.**

## Серверные секреты

- `SUPABASE_SERVICE_ROLE_KEY` и `TELEGRAM_BOT_TOKEN` используются только в API routes / server-side (например, `src/lib/telegram.ts`, `src/lib/supabaseAdmin.ts`). На клиент они не экспортируются.
- В коде нет логирования токенов; в логах выводятся только `formType`, `leadId`, текст ошибки.
