/**
 * Типы заказа и статусов оплаты.
 * Заказ создаётся из корзины на сервере; сумма пересчитывается по каталогу.
 */

export type OrderStatus =
  | "created"
  | "payment_pending"
  | "paid"
  | "canceled"
  | "failed";

export interface OrderItemPayload {
  id: string;
  name: string;
  price: number; // в рублях (на сервере в заказ сохраняем в копейках в amount)
  quantity: number;
}

export interface OrderCustomerPayload {
  name?: string;
  phone?: string;
  email?: string;
  telegram?: string;
  recipientName?: string;
  recipientPhone?: string;
  deliveryType?: string;
  isPickup?: boolean;
  deliveryAddress?: string;
  deliveryDate?: string;
  deliveryTime?: string;
  deliveryPrice?: number;
  cardText?: string;
  notes?: string;
  askRecipientForDetails?: boolean;
  deliverAnonymously?: boolean;
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
