/**
 * POST /api/payments/tinkoff/init — инициализация платежа Tinkoff.
 * Тело: { orderId }. Заказ должен существовать; сумма берётся из заказа (копейки).
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrderById, updateOrderStatus } from "@/services/orders";
import { getServerBaseUrl } from "@/lib/base-url";
import { tinkoffInit } from "@/lib/tinkoff";

const bodySchema = z.object({
  orderId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const raw = await request.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Неверный orderId" }, { status: 400 });
    }

    const order = await getOrderById(parsed.data.orderId);
    if (!order) {
      console.warn("[tinkoff-init] order not found", { orderId: parsed.data.orderId });
      return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
    }

    if (order.status === "paid") {
      console.warn("[tinkoff-init] order already paid", { orderId: order.id });
      return NextResponse.json({ error: "Заказ уже оплачен" }, { status: 400 });
    }

    const baseUrl = getServerBaseUrl();
    const baseSuccess = process.env.TINKOFF_SUCCESS_URL ?? `${baseUrl}/payment/success`;
    const baseFail = process.env.TINKOFF_FAIL_URL ?? `${baseUrl}/payment/fail`;
    const sep = (u: string) => (u.includes("?") ? "&" : "?");
    const successUrl = `${baseSuccess}${sep(baseSuccess)}orderId=${order.id}`;
    const failUrl = `${baseFail}${sep(baseFail)}orderId=${order.id}`;
    if (!successUrl.startsWith("http") || !failUrl.startsWith("http")) {
      return NextResponse.json(
        {
          error:
            "Задайте NEXT_PUBLIC_SITE_URL или TINKOFF_SUCCESS_URL/TINKOFF_FAIL_URL (абсолютные URL) для редиректа после оплаты.",
        },
        { status: 502 }
      );
    }
    const notificationUrl = process.env.TINKOFF_NOTIFICATION_URL ?? "";

    const c = order.customer ?? {};
    const data: Record<string, string> = {};
    if (c.deliveryAddress) data.Address = c.deliveryAddress;
    if (c.deliveryDate) data.Date = c.deliveryDate;
    if (c.deliveryTime) data.Time = c.deliveryTime;
    if (c.name) data.CustomerName = c.name;
    if (c.phone) data.Phone = c.phone;

    // Чек ФФД — обязателен, если терминал требует онлайн-кассу (ошибка 309)
    const rawPhone = (c.phone ?? "").replace(/\D/g, "");
    const receiptPhone =
      rawPhone.length >= 10
        ? rawPhone.startsWith("7")
          ? `+${rawPhone}`
          : `+7${rawPhone.replace(/^8/, "")}`
        : undefined;
    const orderAmountKopeks = Math.round(order.amount);
    const rawItems = order.items.map((item) => {
      const priceKopeks = Math.round(item.price * 100);
      const qty = Math.max(0.001, item.quantity);
      const amountKopeks = Math.round(priceKopeks * qty);
      return {
        Name: item.name.slice(0, 128),
        Price: priceKopeks,
        Quantity: qty,
        Amount: amountKopeks,
        Tax: "none" as const,
      };
    });
    const rawTotal = rawItems.reduce((s, i) => s + i.Amount, 0);
    let receiptItems =
      rawTotal > 0
        ? rawItems.map((item) => ({
            ...item,
            Amount: Math.round((item.Amount * orderAmountKopeks) / rawTotal),
          }))
        : rawItems;
    const sum = receiptItems.reduce((s, i) => s + i.Amount, 0);
    if (receiptItems.length > 0 && sum !== orderAmountKopeks) {
      const lastIdx = receiptItems.length - 1;
      receiptItems = receiptItems.map((item, idx) =>
        idx === lastIdx ? { ...item, Amount: Math.max(1, item.Amount + orderAmountKopeks - sum) } : item
      );
    }

    // Receipt обязателен — терминал требует онлайн-кассу. Если нет телефона — fallback email.
    const receiptEmail = c.email?.trim() || (!receiptPhone ? process.env.RECEIPT_FALLBACK_EMAIL || "info@theame.ru" : undefined);

    const initResult = await tinkoffInit({
      Amount: Math.round(order.amount),
      OrderId: order.id,
      Description: `Оплата заказа #${order.id.slice(0, 8)}`,
      SuccessURL: successUrl,
      FailURL: failUrl,
      NotificationURL: notificationUrl || undefined,
      Data: Object.keys(data).length > 0 ? data : undefined,
      Receipt:
        receiptItems.length > 0
          ? {
              Email: receiptEmail || undefined,
              Phone: receiptPhone || undefined,
              Taxation: "usn_income",
              Items: receiptItems,
            }
          : undefined,
    });

    if ("error" in initResult) {
      const details = initResult.details as { ErrorCode?: string; Details?: string } | undefined;
      console.warn("[tinkoff-init] Init failed", {
        orderId: order.id,
        errorCode: details?.ErrorCode,
        details: details?.Details,
      });
      return NextResponse.json(
        { error: initResult.error ?? "Неверные параметры" },
        { status: 502 }
      );
    }

    await updateOrderStatus(order.id, "payment_pending", initResult.PaymentId);

    console.log("[tinkoff-init] ok", { orderId: order.id, paymentId: initResult.PaymentId });
    return NextResponse.json({
      paymentUrl: initResult.PaymentURL,
      orderId: order.id,
    });
  } catch (e) {
    console.error("[tinkoff-init] error", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Ошибка инициализации платежа" }, { status: 500 });
  }
}
