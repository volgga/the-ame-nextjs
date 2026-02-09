/**
 * GET /api/tinkoff-status?orderId=... — статус платежа.
 * Сначала по orderId берём заказ из БД; при наличии PaymentId запрашиваем GetState у T-Bank.
 * Возвращает { status, paymentStatus? } для отображения на страницах success/fail.
 */

import { NextResponse } from "next/server";
import { getOrderById } from "@/services/orders";
import { tinkoffGetState } from "@/lib/tinkoff";

const TBANK_SUCCESS_STATUSES = new Set(["CONFIRMED", "AUTHORIZED"]);
const TBANK_FAIL_STATUSES = new Set(["CANCELED", "REJECTED", "DEADLINE_EXPIRED", "REFUNDED"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");
  const paymentId = searchParams.get("paymentId");

  if (!orderId && !paymentId) {
    return NextResponse.json({ error: "orderId or paymentId required" }, { status: 400 });
  }

  const order = orderId ? await getOrderById(orderId) : null;
  const pid = paymentId ?? order?.tinkoffPaymentId ?? order?.paymentId ?? null;

  if (pid) {
    const state = await tinkoffGetState(pid);
    if (!("error" in state)) {
      const paymentStatus = state.Status;
      const paid = TBANK_SUCCESS_STATUSES.has(paymentStatus);
      const failed = TBANK_FAIL_STATUSES.has(paymentStatus);
      return NextResponse.json({
        status: paid ? "paid" : failed ? "failed" : "pending",
        paymentStatus,
      });
    }
  }

  if (order) {
    const status =
      order.status === "paid"
        ? "paid"
        : order.status === "failed" || order.status === "canceled"
          ? "failed"
          : "pending";
    return NextResponse.json({ status });
  }

  return NextResponse.json({ error: "Order not found" }, { status: 404 });
}
