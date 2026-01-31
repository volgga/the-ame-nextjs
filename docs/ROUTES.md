# Маршруты и редиректы

## Публичные страницы

| URL | Назначение | Статус |
|-----|------------|--------|
| `/` | Главная страница | ✅ |
| `/posmotret-vse-tsvety` | Каталог всех товаров | ✅ |
| `/magazine/[slug]` | Товары категории | ✅ |
| `/product/[slug]` | Карточка товара | ✅ |
| `/cart` | Корзина | ✅ |
| `/about` | О нас | ✅ |
| `/contacts` | Контакты | ✅ |
| `/delivery-and-payments` | Доставка и оплата | ✅ |

---

## Редиректы (308 Permanent)

Настроены в `src/middleware.ts`:

| Старый URL | Новый URL |
|------------|-----------|
| `/catalog` | `/posmotret-vse-tsvety` |
| `/catalog?category=<slug>` | `/magazine/<slug>` |
| `/catalog/<slug>` | `/magazine/<slug>` |
| `/posmotret-vse-tsvety?category=<slug>` | `/magazine/<slug>` |
| `/posmotret-vse-tsvety/<slug>` | `/magazine/<slug>` |

### Резервные редиректы (в page.tsx)
Если middleware не сработает, страницы `/catalog` и `/posmotret-vse-tsvety/[category]` выполняют `permanentRedirect()`.

---

## Админка

| URL | Назначение | Защита |
|-----|------------|--------|
| `/admin` | Главная админки | Cookie auth |
| `/admin/login` | Вход | Публичная |
| `/admin/slides` | Управление слайдами | Cookie auth |
| `/admin/categories` | Управление категориями | Cookie auth |
| `/admin/products` | Список товаров | Cookie auth |
| `/admin/products/[id]` | Редактирование товара | Cookie auth |
| `/admin/products/new` | Новый товар | Cookie auth |

### Защита админки
Middleware проверяет cookie сессии. Без авторизации → редирект на `/admin/login`.

---

## API endpoints

### Публичные

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/api/categories` | Категории для меню |
| POST | `/api/orders` | Создание заказа |
| GET | `/api/orders/[id]` | Информация о заказе |
| POST | `/api/payments/tinkoff/init` | Инициализация платежа |
| POST | `/api/payments/tinkoff/notification` | Webhook Tinkoff |

### Admin API (защищённые)

| Метод | Путь | Назначение |
|-------|------|------------|
| POST | `/api/admin/login` | Вход в админку |
| POST | `/api/admin/logout` | Выход |
| GET/POST | `/api/admin/slides` | CRUD слайдов |
| POST | `/api/admin/slides/upload` | Upload файла |
| POST | `/api/admin/slides/reorder` | Сохранение порядка |
| PATCH/DELETE | `/api/admin/slides/[id]` | Обновление/удаление |
| GET/POST | `/api/admin/categories` | CRUD категорий |
| PATCH/DELETE | `/api/admin/categories/[id]` | Обновление/удаление |
| POST | `/api/admin/categories/reorder` | Сохранение порядка |
| GET/POST | `/api/admin/products` | CRUD товаров |
| PATCH/DELETE | `/api/admin/products/[id]` | Обновление/удаление |

---

## Меню "Каталог" (выпадающее)

**Компонент:** `src/components/header/CatalogDropdown.tsx`

Структура:
1. **"Все цветы"** → `/posmotret-vse-tsvety`
2. **Категории из БД** → `/magazine/<slug>`

Данные: GET `/api/categories` (кешируется на 2 минуты).

---

## Проверка работоспособности

```bash
# Главная
curl -I https://theame.ru/

# Каталог
curl -I https://theame.ru/posmotret-vse-tsvety

# Категория
curl -I https://theame.ru/magazine/avtorskie-bukety

# Редирект /catalog
curl -I https://theame.ru/catalog
# Ожидается: 308 -> /posmotret-vse-tsvety

# Редирект /catalog/<slug>
curl -I https://theame.ru/catalog/mono-bukety
# Ожидается: 308 -> /magazine/mono-bukety
```
