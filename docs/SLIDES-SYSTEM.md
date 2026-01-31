# Система слайдов (Hero Slider)

## Карта файлов

| Файл | Назначение |
|------|------------|
| `src/components/hero/HeroCarousel.tsx` | Hero-слайдер на главной |
| `src/components/hero/ChevronArrow.tsx` | SVG стрелки навигации |
| `src/components/admin/slides/SlidesGrid.tsx` | Сетка карточек с DnD |
| `src/components/admin/slides/SlideCard.tsx` | Карточка слайда |
| `src/app/admin/slides/page.tsx` | Страница админки слайдов |
| `src/app/api/admin/slides/route.ts` | GET список, POST создать |
| `src/app/api/admin/slides/upload/route.ts` | POST загрузка файла |
| `src/app/api/admin/slides/reorder/route.ts` | POST сохранение порядка |
| `src/app/api/admin/slides/[id]/route.ts` | PATCH обновить, DELETE удалить |
| `src/lib/heroSlides.ts` | Загрузка активных слайдов для главной |

## Обзор

Слайды показываются на главной странице в виде hero-карусели. Управляются через админку `/admin/slides`.

## Главная страница

- **Компонент:** `src/components/hero/HeroCarousel.tsx`
- **Данные:** `src/lib/heroSlides.ts` → `getActiveHeroSlides()`
- **Фильтр:** только `is_active = true`
- **Сортировка:** по `sort_order` ASC
- **Контент:** только изображения, без заголовков/подзаголовков
- **Автоплей:** 5 секунд на слайд
- **Transition:** 800ms ease-in-out
- **Стрелки:** `src/components/hero/ChevronArrow.tsx` — белые chevron, без фона

### Изменение таймингов

В `HeroCarousel.tsx`:
- `AUTOPLAY_MS = 5000` — интервал автопрокрутки
- `TRANSITION_MS = 800` — длительность перехода

### Изменение стрелок

Компонент `ChevronArrow.tsx` в `src/components/hero/`.

## Таблица hero_slides

| Поле        | Тип    | Описание                          |
|------------|--------|-----------------------------------|
| id         | UUID   | PK                                |
| image_url  | TEXT   | Публичный URL изображения (Supabase Storage) |
| sort_order | INT    | Порядок отображения (0, 1, 2...)  |
| is_active  | BOOLEAN| Показывать на главной             |
| created_at | TIMESTAMPTZ |                              |
| updated_at | TIMESTAMPTZ |                              |

## Админка /admin/slides

- **Страница:** `src/app/admin/slides/page.tsx`
- **Компоненты:** `SlidesGrid`, `SlideCard` в `src/components/admin/slides/`
- **Форма:** модальное окно (добавить/редактировать)
- **Поля:** загрузка изображения (file), чекбокс «Активен», поле «Порядок»
- **Сохранение порядка:** только по кнопке «Сохранить»; «Не сохранять» сбрасывает черновик

## Upload изображений

- **API:** `POST /api/admin/slides/upload`
- **Формат:** `multipart/form-data` (file, опционально slideId)
- **Bucket:** `hero-slides` (Supabase Storage)
- **Лимиты:** 15MB, форматы JPEG, PNG, WebP, AVIF
- **Путь:** `{uuid}-{timestamp}.{ext}`
- **Запись:** только через server API (service_role), не из браузера

## API роуты

| Метод | Путь | Описание |
|-------|------|----------|
| GET   | /api/admin/slides | Список слайдов (admin) |
| POST  | /api/admin/slides | Создать слайд |
| POST  | /api/admin/slides/upload | Загрузить файл |
| POST  | /api/admin/slides/reorder | Сохранить порядок (batch) |
| PATCH | /api/admin/slides/[id] | Обновить слайд |
| DELETE| /api/admin/slides/[id] | Удалить слайд + файл из Storage |

## Storage bucket hero-slides

- **Публичное чтение:** да (для отображения на главной)
- **Запись:** только через server API (service_role)
- См. `docs/SLIDES-STORAGE.md` для создания bucket и политик.
