/**
 * Форматирование сообщений для отправки в Telegram.
 * Все сообщения форматируются в HTML с использованием эмодзи.
 */

/**
 * Собирает полный URL из базового адреса сайта и относительного пути.
 * Использует NEXT_PUBLIC_SITE_URL. Не допускает двойных слешей.
 */
export function buildAbsoluteUrl(pathOrEmpty: string | null | undefined): string | null {
  const base = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SITE_URL : undefined;
  if (!base || !pathOrEmpty) return null;
  const baseClean = base.replace(/\/+$/, "");
  const path = pathOrEmpty.trim();
  if (!path) return baseClean;
  const pathNorm = path.startsWith("/") ? path : `/${path}`;
  return `${baseClean}${pathNorm}`;
}

/**
 * Данные формы "Купить в 1 клик"
 */
export interface OneClickFormData {
  phone: string;
  name?: string | null;
  productTitle?: string | null;
  pageUrl?: string | null;
  productId?: string | null;
  /** Полный URL страницы товара (если передан — используется как ссылка) */
  productUrl?: string | null;
  /** Путь вида /product/slug (fallback для сборки ссылки) */
  productPath?: string | null;
}

/**
 * Данные формы "Заказать букет" (главная страница)
 */
export interface BouquetFormData {
  phone: string;
  name?: string | null;
  message?: string | null;
  comment?: string | null;
  pageUrl?: string | null;
}

/**
 * Данные формы "Намекнуть о подарке"
 */
export interface GiftHintFormData {
  phone: string;
  name?: string | null;
  recipientName?: string | null;
  preferredDate?: string | null;
  comment?: string | null;
  pageUrl?: string | null;
  productTitle?: string | null;
  productId?: string | null;
  productUrl?: string | null;
  productPath?: string | null;
}

/**
 * Данные формы "Предзаказ"
 */
export interface PreorderFormData {
  phone: string;
  name?: string | null;
  /** Дата, выбранная пользователем (формат YYYY-MM-DD или другая строка) */
  preorderDate: string;
  productTitle?: string | null;
  pageUrl?: string | null;
  productId?: string | null;
  /** Полный URL страницы товара (если передан — используется как ссылка) */
  productUrl?: string | null;
  /** Путь вида /product/slug (fallback для сборки ссылки) */
  productPath?: string | null;
}

/**
 * Экранирует HTML-специальные символы для безопасного использования в HTML.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Форматирует сообщение для формы "Купить в 1 клик".
 * Не выводит Страница, ID товара, Lead ID. Товар — полная кликабельная ссылка.
 */
export function formatOneClickMessage(data: OneClickFormData, _leadId?: string): string {
  const name = data.name?.trim();
  const productTitle = data.productTitle?.trim();
  const productLink =
    data.productUrl?.trim() || buildAbsoluteUrl(data.productPath?.trim() || data.pageUrl?.trim() || null);

  let message = `🛒 <b>Купить в 1 клик (горячий лид)</b>

`;
  if (name) {
    message += `<b>Имя:</b> ${escapeHtml(name)}\n`;
  }
  message += `<b>Телефон:</b> <code>${escapeHtml(data.phone)}</code>\n`;

  if (productTitle) {
    message += `<b>Товар:</b> ${escapeHtml(productTitle)}\n`;
  }
  if (productLink) {
    message += `<b>Товар:</b> <a href="${escapeHtml(productLink)}">${escapeHtml(productLink)}</a>`;
  } else if (!productTitle) {
    message += `<b>Товар:</b> —`;
  }

  return message.trim();
}

/**
 * Форматирует сообщение для формы "Заказать букет" (главная страница).
 * Не выводит Страница, Lead ID.
 */
export function formatBouquetMessage(data: BouquetFormData, _leadId?: string): string {
  const name = data.name?.trim();
  const wishes = data.message?.trim() || data.comment?.trim();

  let text = `💐 <b>Заказать букет (помочь подобрать)</b>

`;
  if (name) {
    text += `<b>Имя:</b> ${escapeHtml(name)}\n`;
  }
  text += `<b>Телефон:</b> <code>${escapeHtml(data.phone)}</code>`;

  if (wishes) {
    text += `\n<b>Пожелания:</b> ${escapeHtml(wishes)}`;
  }

  return text.trim();
}

/**
 * Форматирует сообщение для формы "Намекнуть о подарке".
 * Не выводит Страница, Lead ID. Товар: название (если есть) и отдельной строкой кликабельная ссылка.
 */
export function formatGiftHintMessage(data: GiftHintFormData, _leadId?: string): string {
  const name = data.name?.trim();
  const recipientName = data.recipientName?.trim();
  const productTitle = data.productTitle?.trim();
  const productLink =
    data.productUrl?.trim() || buildAbsoluteUrl(data.productPath?.trim() || data.pageUrl?.trim() || null);
  const preferredDate = data.preferredDate?.trim();
  const comment = data.comment?.trim();

  let text = `🎁 <b>Намекнуть о подарке</b>

`;
  if (name) {
    text += `<b>Имя:</b> ${escapeHtml(name)}\n`;
  }
  text += `<b>Телефон:</b> <code>${escapeHtml(data.phone)}</code>`;

  if (recipientName) {
    text += `\n<b>Получатель:</b> ${escapeHtml(recipientName)}`;
  }
  if (productTitle) {
    text += `\n<b>Товар:</b> ${escapeHtml(productTitle)}`;
  }
  if (productLink) {
    text += `\n<b>Товар:</b> <a href="${escapeHtml(productLink)}">${escapeHtml(productLink)}</a>`;
  }
  if (preferredDate) {
    text += `\n<b>Предпочтительная дата:</b> <code>${escapeHtml(preferredDate)}</code>`;
  }
  text += `\n<b>Комментарий:</b> ${comment ? escapeHtml(comment) : "-"}`;

  return text.trim();
}

/**
 * Форматирует сообщение для формы "Предзаказ".
 * Формат (простой текст, без HTML-разметки), пример:
 *
 * ❗ Предзаказ
 *
 * Телефон: +75454545455
 * Товар: теста
 * Товар: http://localhost:3000/product/testa
 * Дата: 2025-01-01
 */
export function formatPreorderMessage(data: PreorderFormData, _leadId?: string): string {
  const name = data.name?.trim();
  const productTitle = data.productTitle?.trim();
  const productLink =
    data.productUrl?.trim() || buildAbsoluteUrl(data.productPath?.trim() || data.pageUrl?.trim() || null);
  const preorderDate = data.preorderDate?.trim();

  const lines: string[] = [];
  lines.push("❗ Предзаказ");
  lines.push("");
  if (name) {
    lines.push(`Имя: ${name}`);
  }
  lines.push(`Телефон: ${data.phone}`);
  if (productTitle) {
    lines.push(`Товар: ${productTitle}`);
  }
  if (productLink) {
    lines.push(`Товар: ${productLink}`);
  }
  if (preorderDate) {
    lines.push(`Дата: ${preorderDate}`);
  }

  return lines.join("\n").trim();
}
