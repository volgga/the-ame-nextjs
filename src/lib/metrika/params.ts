/**
 * Яндекс.Метрика — параметры визита/сессии (visit/session params).
 * Доки: https://yandex.ru/support/metrica/objects/params.html
 *
 * ⚠️ НЕ передавать PII (персональные данные): телефон, email, имя, адрес.
 * Только анонимные параметры для аналитики: тип страницы, категория, ID товара.
 */

const YANDEX_METRIKA_ID = 103806735;

declare global {
  interface Window {
    ym?: (id: number, action: string, opts?: string | object) => void;
  }
}

export type PageType = "home" | "catalog" | "product" | "cart" | "checkout" | "success" | "blog" | "about" | "contacts";

/**
 * Отправить параметры визита в Яндекс.Метрику.
 * Вызывать только на клиенте после монтирования компонента.
 */
export function sendMetrikaParams(params: {
  page_type: PageType;
  category_slug?: string;
  product_id?: string;
}): void {
  if (typeof window === "undefined" || !window.ym) return;

  const cleanParams: Record<string, string> = {
    page_type: params.page_type,
  };

  if (params.category_slug) {
    cleanParams.category_slug = params.category_slug;
  }

  if (params.product_id) {
    cleanParams.product_id = params.product_id;
  }

  window.ym(YANDEX_METRIKA_ID, "params", cleanParams);
}
