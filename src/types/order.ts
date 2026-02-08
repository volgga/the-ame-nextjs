/**
 * Типы заказа и статусов оплаты.
 * Заказ создаётся из корзины на сервере; сумма пересчитывается по каталогу.
 */

export type OrderStatus = "created" | "payment_pending" | "paid" | "canceled" | "failed";

export interface OrderItemPayload {
  id: string;
  name: string;
  price: number; // в рублях (на сервере в заказ сохраняем в копейках в amount)
  quantity: number;
  /** Путь карточки товара для ссылки в уведомлениях, например /product/slug */
  productPath?: string;
  /** Название варианта (для вариантных товаров); выводится в TG */
  variantTitle?: string;
}

export interface OrderCustomerPayload {
  name?: string;
  phone?: string;
  email?: string;
  telegram?: string;
  recipientName?: string;
  recipientPhone?: string;
  deliveryType?: string;
  /** Название района доставки (для отображения в уведомлениях) */
  deliveryZoneTitle?: string;
  isPickup?: boolean;
  deliveryAddress?: string;
  deliveryDate?: string;
  deliveryTime?: string;
  deliveryPrice?: number;
  cardText?: string;
  notes?: string;
  askRecipientForDetails?: boolean;
  deliverAnonymously?: boolean;
  /** false = получатель другой человек, true = получатель сам клиент */
  isRecipientSelf?: boolean;
  /** Согласие на получение рассылки */
  receiveMailings?: boolean;
  /** Промокод (в уведомлении показывается всегда: значение или —) */
  promocode?: string;
}

export interface OrderRecord {
  id: string;
  items: OrderItemPayload[];
  amount: number; // итог в копейках (в БД — amount, bigint)
  currency: string;
  customer: OrderCustomerPayload;
  status: OrderStatus;
  tinkoffPaymentId: string | null;
  paymentId?: string | null;
  paymentProvider?: string | null;
  createdAt: string;
  updatedAt: string;
}
