/**
 * Форматирование сообщений для отправки в Telegram.
 * Все сообщения форматируются в HTML с использованием эмодзи.
 */

/**
 * Данные формы "Купить в 1 клик"
 */
export interface OneClickFormData {
  phone: string;
  name?: string | null;
  productTitle?: string | null;
  pageUrl?: string | null;
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
 */
export function formatOneClickMessage(data: OneClickFormData, leadId?: string): string {
  const name = data.name?.trim() || "Не указано";
  const productTitle = data.productTitle?.trim() || "Не указано";
  const pageUrl = data.pageUrl?.trim();

  let message = `🛒 <b>Купить в 1 клик</b>

<b>Имя:</b> ${escapeHtml(name)}
<b>Телефон:</b> <code>${escapeHtml(data.phone)}</code>
<b>Товар:</b> <code>${escapeHtml(productTitle)}</code>`;

  if (pageUrl) {
    message += `\n<b>Страница:</b> <code>${escapeHtml(pageUrl)}</code>`;
  }

  if (leadId) {
    message += `\n<b>Lead ID:</b> <code>${escapeHtml(leadId)}</code>`;
  }

  return message;
}

/**
 * Форматирует сообщение для формы "Заказать букет" (главная страница).
 */
export function formatBouquetMessage(data: BouquetFormData, leadId?: string): string {
  const name = data.name?.trim() || "Не указано";
  const message = data.message?.trim() || data.comment?.trim();
  const pageUrl = data.pageUrl?.trim();

  let text = `💐 <b>Заказать букет</b>

<b>Имя:</b> ${escapeHtml(name)}
<b>Телефон:</b> <code>${escapeHtml(data.phone)}</code>`;

  if (message) {
    text += `\n<b>Сообщение:</b> ${escapeHtml(message)}`;
  }

  if (pageUrl) {
    text += `\n<b>Страница:</b> <code>${escapeHtml(pageUrl)}</code>`;
  }

  if (leadId) {
    text += `\n<b>Lead ID:</b> <code>${escapeHtml(leadId)}</code>`;
  }

  return text;
}

/**
 * Форматирует сообщение для формы "Намекнуть о подарке".
 */
export function formatGiftHintMessage(data: GiftHintFormData, leadId?: string): string {
  const name = data.name?.trim() || "Не указано";
  const recipientName = data.recipientName?.trim();
  const preferredDate = data.preferredDate?.trim();
  const comment = data.comment?.trim();
  const pageUrl = data.pageUrl?.trim();

  let text = `🎁 <b>Намекнуть о подарке</b>

<b>Имя:</b> ${escapeHtml(name)}
<b>Телефон:</b> <code>${escapeHtml(data.phone)}</code>`;

  if (recipientName) {
    text += `\n<b>Получатель:</b> ${escapeHtml(recipientName)}`;
  }

  if (preferredDate) {
    text += `\n<b>Предпочтительная дата:</b> <code>${escapeHtml(preferredDate)}</code>`;
  }

  if (comment) {
    text += `\n<b>Комментарий:</b> ${escapeHtml(comment)}`;
  }

  if (pageUrl) {
    text += `\n<b>Страница:</b> <code>${escapeHtml(pageUrl)}</code>`;
  }

  if (leadId) {
    text += `\n<b>Lead ID:</b> <code>${escapeHtml(leadId)}</code>`;
  }

  return text;
}
