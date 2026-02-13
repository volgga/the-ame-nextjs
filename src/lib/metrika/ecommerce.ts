/**
 * Яндекс.Метрика — ручная электронная коммерция через dataLayer (Enhanced Ecommerce).
 * Доки: https://yandex.ru/support/metrica/data/e-commerce.html
 * Формат: https://yandex.ru/support/metrica/ecommerce/data.html
 *
 * ⚠️ Не отправлять событие прямо перед навигацией (onclick + переход): событие может не успеть уйти.
 * Отправлять на странице успеха или до навигации с небольшой задержкой (requestAnimationFrame / setTimeout 150–300 ms).
 */

const CURRENCY = "RUB";

/** Минимальный объект товара для e-commerce (id или name обязателен по доке) */
export interface EcommerceProduct {
  id: string;
  name?: string;
  price?: number;
  quantity?: number;
  category?: string;
  variant?: string;
  brand?: string;
}

/** Поля actionField для purchase (обязателен id) */
export interface PurchaseActionField {
  id: string;
  revenue?: number;
  shipping?: number;
  tax?: number;
  coupon?: string;
}

/** Заказ для purchase */
export interface PurchaseOrder {
  id: string;
  revenue: number;
  shipping?: number;
  tax?: number;
  coupon?: string;
  products: EcommerceProduct[];
}

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

/** Безопасно получить dataLayer (null на сервере). */
export function getDataLayer(): Record<string, unknown>[] | null {
  if (typeof window === "undefined") return null;
  window.dataLayer = window.dataLayer || [];
  return window.dataLayer;
}

/** Добавить e-commerce объект в dataLayer. Вызывать только на клиенте. */
function pushEcommerce(payload: { ecommerce: Record<string, unknown> }): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
}

function toProductFields(p: EcommerceProduct): Record<string, unknown> {
  const out: Record<string, unknown> = {
    id: p.id,
    name: p.name ?? "",
    price: typeof p.price === "number" ? p.price : undefined,
    quantity: typeof p.quantity === "number" ? p.quantity : 1,
  };
  if (p.category) out.category = p.category;
  if (p.variant) out.variant = p.variant;
  if (p.brand) out.brand = p.brand;
  return out;
}

/** Просмотр карточки товара (detail). Вызывать при открытии страницы товара / модалки. */
export function trackProductDetail(product: EcommerceProduct): void {
  pushEcommerce({
    ecommerce: {
      currencyCode: CURRENCY,
      detail: {
        products: [toProductFields({ ...product, quantity: 1 })],
      },
    },
  });
}

/** Добавление в корзину (add). */
export function trackAddToCart(product: EcommerceProduct, quantity?: number): void {
  pushEcommerce({
    ecommerce: {
      currencyCode: CURRENCY,
      add: {
        products: [toProductFields({ ...product, quantity: quantity ?? 1 })],
      },
    },
  });
}

/** Удаление из корзины (remove). */
export function trackRemoveFromCart(product: EcommerceProduct, quantity?: number): void {
  pushEcommerce({
    ecommerce: {
      currencyCode: CURRENCY,
      remove: {
        products: [toProductFields({ ...product, quantity: quantity ?? 1 })],
      },
    },
  });
}

const PURCHASE_SENT_KEY = "ym_ecom_purchase_sent_";

/** Проверить, был ли purchase уже отправлен для этого заказа. */
export function isPurchaseAlreadySent(orderId: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    return sessionStorage.getItem(PURCHASE_SENT_KEY + orderId) === "1";
  } catch {
    return false;
  }
}

/** Покупка (purchase). Вызывать один раз на странице успеха; внутри — защита от дубля по orderId. */
export function trackPurchase(order: PurchaseOrder): void {
  if (typeof window === "undefined") return;
  if (isPurchaseAlreadySent(order.id)) return;
  try {
    sessionStorage.setItem(PURCHASE_SENT_KEY + order.id, "1");
  } catch {
    /* ignore */
  }
  const actionField: PurchaseActionField = {
    id: order.id,
    revenue: order.revenue,
  };
  if (typeof order.shipping === "number") actionField.shipping = order.shipping;
  if (typeof order.tax === "number") actionField.tax = order.tax;
  if (order.coupon) actionField.coupon = order.coupon;

  pushEcommerce({
    ecommerce: {
      currencyCode: CURRENCY,
      purchase: {
        actionField,
        products: order.products.map(toProductFields),
      },
    },
  });
}
