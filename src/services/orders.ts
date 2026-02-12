/**
 * Сервис заказов: создание из корзины (пересчёт суммы по каталогу), обновление статуса.
 */

import { getCatalogProductsByIds } from "@/lib/catalogServer";
import { getSupabaseServer } from "@/lib/supabaseServer";
import type { OrderCustomerPayload, OrderItemPayload, OrderRecord, OrderStatus } from "@/types/order";

export interface CreateOrderInput {
  items: { id: string; quantity: number }[];
  customer: OrderCustomerPayload;
  /** Опционально: скидка по промокоду в рублях (вычитается из суммы заказа). */
  getPromoDiscountRubles?: (subtotalRubles: number) => Promise<number>;
}

/**
 * Создать заказ: валидировать товары по каталогу, пересчитать сумму на сервере.
 * Возвращает заказ или ошибку.
 */
export async function createOrder(input: CreateOrderInput): Promise<{ order: OrderRecord } | { error: string }> {
  if (!input.items.length) {
    return { error: "Корзина пуста" };
  }

  const catalog = await getCatalogProductsByIds(input.items.map((i) => i.id));
  const orderItems: OrderItemPayload[] = [];
  let amountKopeks = 0;

  for (const { id, quantity } of input.items) {
    if (quantity < 1) continue;
    const product = catalog.get(id);
    if (!product) {
      return { error: `Товар не найден: ${id}` };
    }
    const lineTotal = Math.round(product.price * quantity * 100); // рубли -> копейки
    const productPath = product.slug ? `/product/${product.slug}` : undefined;
    orderItems.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity,
      ...(productPath && { productPath }),
      ...(product.variantTitle && { variantTitle: product.variantTitle }),
    });
    amountKopeks += lineTotal;
  }

  if (orderItems.length === 0) {
    return { error: "Нет валидных позиций в заказе" };
  }

  let finalAmountKopeks = amountKopeks;
  if (input.getPromoDiscountRubles) {
    const subtotalRubles = amountKopeks / 100;
    const discountRubles = await input.getPromoDiscountRubles(subtotalRubles);
    const discountKopeks = Math.round(discountRubles * 100);
    finalAmountKopeks = Math.max(0, amountKopeks - discountKopeks);
  }

  const supabase = getSupabaseServer();
  // Таблица orders не в сгенерированных типах Supabase — используем приведение типа
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("orders")
    .insert({
      items: orderItems,
      amount: finalAmountKopeks,
      currency: "RUB",
      customer: input.customer,
      status: "created",
      tinkoff_payment_id: null,
      payment_provider: "tinkoff",
    })
    .select(
      "id, items, amount, currency, customer, status, tinkoff_payment_id, payment_id, payment_provider, created_at, updated_at"
    )
    .single();

  if (error) {
    return { error: error.message };
  }

  const row = data as {
    id: string;
    items: OrderItemPayload[];
    amount: number;
    currency: string;
    customer: OrderCustomerPayload;
    status: OrderStatus;
    tinkoff_payment_id: string | null;
    payment_id?: string | null;
    payment_provider?: string | null;
    created_at: string;
    updated_at: string;
  };

  return {
    order: {
      id: row.id,
      items: row.items,
      amount: row.amount,
      currency: row.currency,
      customer: row.customer,
      status: row.status,
      tinkoffPaymentId: row.tinkoff_payment_id ?? row.payment_id ?? null,
      paymentId: row.payment_id ?? row.tinkoff_payment_id ?? null,
      paymentProvider: row.payment_provider ?? "tinkoff",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
  };
}

/**
 * Получить заказ по id.
 */
export async function getOrderById(orderId: string): Promise<OrderRecord | null> {
  const supabase = getSupabaseServer();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("orders")
    .select(
      "id, items, amount, currency, customer, status, tinkoff_payment_id, payment_id, payment_provider, created_at, updated_at"
    )
    .eq("id", orderId)
    .single();

  if (error || !data) return null;

  const row = data as {
    id: string;
    items: OrderItemPayload[];
    amount: number;
    currency: string;
    customer: OrderCustomerPayload;
    status: OrderStatus;
    tinkoff_payment_id: string | null;
    payment_id?: string | null;
    payment_provider?: string | null;
    created_at: string;
    updated_at: string;
  };

  return {
    id: row.id,
    items: row.items,
    amount: row.amount,
    currency: row.currency,
    customer: row.customer,
    status: row.status,
    tinkoffPaymentId: row.tinkoff_payment_id ?? row.payment_id ?? null,
    paymentId: row.payment_id ?? row.tinkoff_payment_id ?? null,
    paymentProvider: row.payment_provider ?? "tinkoff",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Обновить статус заказа и (опционально) tinkoffPaymentId.
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  tinkoffPaymentId?: string | null
): Promise<boolean> {
  const supabase = getSupabaseServer();
  const payload: {
    status: OrderStatus;
    tinkoff_payment_id?: string | null;
    payment_id?: string | null;
  } = { status };
  if (tinkoffPaymentId !== undefined) {
    payload.tinkoff_payment_id = tinkoffPaymentId;
    payload.payment_id = tinkoffPaymentId;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("orders").update(payload).eq("id", orderId);
  return !error;
}

/**
 * Проверить и атомарно отметить отправку уведомления о платеже.
 * Возвращает true, если уведомление нужно отправить (еще не отправляли), false если уже отправляли.
 * Обеспечивает идемпотентность: даже при параллельных вызовах уведомление уйдет только один раз.
 */
export async function markPaymentNotificationSent(
  orderId: string,
  eventType: "SUCCESS" | "FAIL"
): Promise<boolean> {
  const supabase = getSupabaseServer();
  const fieldName = eventType === "SUCCESS" ? "payment_success_notified_at" : "payment_fail_notified_at";
  const now = new Date().toISOString();

  // Атомарное обновление: обновляем только если поле null
  // Используем условие в update для атомарности
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("orders")
    .update({ [fieldName]: now })
    .eq("id", orderId)
    .is(fieldName, null)
    .select("id");

  if (error) {
    console.error(`[markPaymentNotificationSent] error for orderId=${orderId}, eventType=${eventType}`, error);
    // При ошибке лучше не отправлять повторно, чтобы не спамить
    return false;
  }

  // Если data пустой массив - значит поле уже было заполнено (условие .is(fieldName, null) не сработало)
  // Если data содержит запись - значит мы успешно обновили (было null, стало now)
  return Array.isArray(data) && data.length > 0;
}
