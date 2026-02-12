/**
 * Единый шаблон Telegram-уведомлений для заказов и оплаты.
 * parse_mode=HTML; все пользовательские данные экранируются.
 */

import type { OrderRecord, OrderItemPayload } from "@/types/order";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function opt(value: string | undefined | null): string {
  return value != null && String(value).trim() !== "" ? escapeHtml(String(value).trim()) : "";
}

/** Сумма в копейках → строка "1 234 ₽" */
function formatAmountKopeks(kopeks: number): string {
  const rub = (kopeks / 100).toFixed(0);
  return rub.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ₽";
}

/** Прод-домен для ссылок в TG, если env не задан или localhost */
const PRODUCTION_SITE_URL = "https://theame.ru";

/** Полная ссылка на товар: SITE_URL или NEXT_PUBLIC_SITE_URL + productPath; иначе https://theame.ru (чтобы в TG всегда прод-ссылки). */
function productFullUrl(productPath: string | undefined): string {
  if (!productPath?.trim()) return "";
  let base = (process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "").trim().replace(/\/+$/, "");
  if (!base || /localhost|127\.0\.0\.1/i.test(base)) base = PRODUCTION_SITE_URL;
  const path = productPath.startsWith("/") ? productPath : `/${productPath}`;
  return `${base}${path}`;
}

/** Строка товара: название [вариант: X] [× N] — кликабельная ссылка (или только название, если нет path) */
function formatItemLine(item: OrderItemPayload): string {
  const qty = item.quantity ?? 1;
  const nameRaw = item.name ?? "—";
  const variantPart = item.variantTitle?.trim() ? ` (вариант: ${escapeHtml(item.variantTitle.trim())})` : "";
  const namePart = qty > 1 ? `${escapeHtml(nameRaw)}${variantPart} × ${qty}` : `${escapeHtml(nameRaw)}${variantPart}`;
  const url = productFullUrl(item.productPath);
  if (url) {
    return `Товар: ${namePart} — <a href="${escapeHtml(url)}">${url}</a>`;
  }
  return `Товар: ${namePart}`;
}

export type OrderNotificationKind = "order_created" | "payment_success" | "payment_failed";

export interface FormatOrderNotificationOptions {
  order: OrderRecord;
  kind: OrderNotificationKind;
  /** Только для payment_failed */
  reason?: string | null;
  /** Для payment_success — id транзакции (в шаблоне не выводим отдельно, но можно использовать при необходимости) */
  paymentId?: string | null;
}

/**
 * Единый форматтер: одно тело шаблона для всех типов уведомлений.
 * Различия: заголовок (emoji + текст), наличие "Причина", наличие "Статус: ожидание оплаты".
 */
export function formatOrderNotification(options: FormatOrderNotificationOptions): string {
  const { order, kind, reason } = options;
  const c = order.customer ?? {};

  const orderIdShort = order.id.slice(0, 8);
  const amountStr = formatAmountKopeks(order.amount);

  const lines: string[] = [];

  // Заголовок
  if (kind === "order_created") {
    lines.push("🧾 <b>Оформление заказа</b>");
  } else if (kind === "payment_success") {
    lines.push("✅ <b>Оплата успешна</b>");
  } else {
    lines.push("❌ <b>Оплата не прошла</b>");
  }
  lines.push("");

  lines.push(`Заказ: #${escapeHtml(orderIdShort)}`);
  lines.push(`Сумма: ${amountStr}`);

  // Товары (каждый: Товар: название — ссылка)
  const items = order.items ?? [];
  for (const item of items) {
    lines.push(formatItemLine(item));
  }

  // Причина — только для payment_failed
  if (kind === "payment_failed" && reason != null && String(reason).trim()) {
    lines.push(`Причина: ${escapeHtml(String(reason).trim())}`);
  }

  lines.push("----------------------------------");
  lines.push("<b>Покупатель</b>");
  const buyerParts = [opt(c.name), opt(c.phone), opt(c.telegram), opt(c.email)].filter(Boolean);
  lines.push(`Клиент: ${buyerParts.length ? buyerParts.join(" / ") : "—"}`);

  lines.push("----------------------------------");
  lines.push("<b>Получатель</b>");
  const hasRecipient = opt(c.recipientName) || opt(c.recipientPhone);
  if (hasRecipient) {
    const recParts = [opt(c.recipientName), opt(c.recipientPhone)].filter(Boolean);
    lines.push(recParts.join(" / "));
  } else {
    lines.push("- не указан");
  }

  lines.push("<b>Опции</b>");
  const recipientDifferent = c.isRecipientSelf === false;
  const anonymous = c.deliverAnonymously === true;
  const askRecipient = c.askRecipientForDetails === true;
  const mailings = c.receiveMailings === true;
  lines.push(`- Получатель другой человек: ${recipientDifferent ? "✅" : "❌"}`);
  lines.push(`- Доставить анонимно: ${anonymous ? "✅" : "❌"}`);
  lines.push(`- Уточнить адрес/время у получателя: ${askRecipient ? "✅" : "❌"}`);
  lines.push(`- Получать рассылки: ${mailings ? "✅" : "❌"}`);

  lines.push("----------------------------------");
  lines.push("<b>Доставка</b>");
  if (c.isPickup === true) {
    lines.push("Самовывоз ✅");
  }
  if (!c.isPickup) {
    const zonePart = opt(c.deliveryZoneTitle ?? c.deliveryType);
    const pricePart =
      typeof c.deliveryPrice === "number"
        ? `${String(Math.round(c.deliveryPrice)).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ₽`
        : "";
    if (zonePart || pricePart) {
      lines.push(`Район: ${[zonePart, pricePart].filter(Boolean).join(" / ")}`);
    }
    if (opt(c.deliveryAddress)) {
      lines.push(`Адрес: ${opt(c.deliveryAddress)}`);
    }
  }
  if (opt(c.deliveryDate) || opt(c.deliveryTime)) {
    lines.push(`Дата: ${[opt(c.deliveryDate), opt(c.deliveryTime)].filter(Boolean).join(" / ")}`);
  }
  if (opt(c.cardText)) {
    lines.push(`Текст открытки: ${opt(c.cardText)}`);
  }
  if (opt(c.notes)) {
    lines.push(`Комментарий к заказу: ${opt(c.notes)}`);
  }
  const promocodeRaw = c.promocode ?? (c as Record<string, unknown>).promocode ?? (c as Record<string, unknown>).promo;
  const promocodeStr =
    promocodeRaw != null && String(promocodeRaw).trim() !== "" ? escapeHtml(String(promocodeRaw).trim()) : "—";
  lines.push(`Промокод: ${promocodeStr}`);

  // Статус — только для order_created
  if (kind === "order_created") {
    lines.push("");
    lines.push("<b>Статус: ожидание оплаты</b>");
  }

  return lines.join("\n");
}

/**
 * Оформление заказа — после нажатия «Оплатить».
 */
export function formatOrderPlaced(order: OrderRecord, _paymentMethod?: string): string {
  return formatOrderNotification({ order, kind: "order_created" });
}

/**
 * Успешная оплата — webhook подтвердил оплату.
 */
export function formatPaymentSuccess(order: OrderRecord, paymentId?: string | null): string {
  return formatOrderNotification({ order, kind: "payment_success", paymentId });
}

/**
 * Неуспешная оплата — webhook: failed / canceled.
 */
export function formatPaymentFailed(order: OrderRecord, reason?: string | null): string {
  return formatOrderNotification({ order, kind: "payment_failed", reason });
}
