# Бегущая дорожка (Marquee)

## Назначение

Управляемый блок «бегущая строка» над зелёным хедером на всех страницах сайта. Включается/выключается в админке; при выключении хедер поднимается вверх без пустого отступа.

## Data contract

- **Тип:** `MarqueeSettings` в `src/lib/homeMarquee.ts`: `{ enabled: boolean; text: string | null; link: string | null }`.
- **БД:** таблица `home_reviews`, колонки `marquee_enabled` (boolean), `marquee_text` (text), `marquee_link` (text). Boolean хранится и читается строго как boolean (нормализация через `marqueeSettingToBoolean` при чтении из БД/ответов API).
- **Валидация (zod в API):** при `enabled=true` текст обязателен; `link` — пусто, относительный `/...` или http(s)://.

## Хранение

- **Таблица:** `home_reviews` (та же, что для отзывов, о нас, FAQ).
- **Миграция:** `scripts/migrations/home-marquee.sql` — добавляет колонки `marquee_enabled`, `marquee_text`, `marquee_link`.
- Запуск: выполнить SQL в Supabase SQL Editor.

## Чтение (публичная часть)

- **Модуль:** `src/lib/homeMarquee.ts`, функция `getHomeMarquee()`.
- Кэш: `unstable_cache` с тегом `["home-marquee"]`, revalidate 300 сек. После сохранения в админке вызывается `revalidateTag("home-marquee", "max")` + `revalidatePath("/")` и `/admin/home`.
- Вызывается в корневом `layout.tsx` (SSR), результат передаётся в `AppShell` → `Header`.

## Изменение (админка)

- **API:** `GET /api/admin/home-marquee` — текущие настройки (защищён сессией). Запрос с формы: `fetch(..., { cache: "no-store" })`.
- **API:** `PATCH /api/admin/home-marquee` — тело: `{ enabled?, text?, link? }`. После успеха: revalidateTag + revalidatePath; ответ — актуальные значения; форма обновляет state из ответа и вызывает `router.refresh()`.
- **UI:** Админка → Главная страница → карточка «Бегущая дорожка» → модалка (чекбокс, текст, ссылка, Сохранить). Чекбокс — controlled, `enabled` при загрузке нормализуется (строка `"false"` не трактуется как true). Двойной submit предотвращён (`saving` + `if (!data || saving) return`).

## Рендер на сайте

- **Header:** при `enabled && text.trim()` рендерит блок с `TopMarquee`; иначе блок не выводится, `marqueeHeight = 0` — пустого места нет.
- **TopMarquee:** при пустом `text` возвращает `null`; при непустом `link` — кликабельная ссылка, иначе div.

## Ручная проверка (5 шагов)

1. Выполнить миграцию `scripts/migrations/home-marquee.sql` в Supabase SQL Editor.
2. Залогиниться в админку → «Главная страница» → «Бегущая дорожка». Включить чекбокс, ввести текст и ссылку (или пусто), нажать «Сохранить». Должно показать «Сохранено ✓», чекбокс остаётся включённым.
3. Закрыть модалку и открыть снова — чекбокс и поля должны показывать сохранённые значения (без хард-рефреша).
4. Открыть главную в другой вкладке: над хедером — бегущая строка; при выключении в админке и сохранении — обновить публичную страницу: дорожки нет, хедер самый верхний, без отступа.
5. Повторить включение/выключение и проверку в обе стороны.
