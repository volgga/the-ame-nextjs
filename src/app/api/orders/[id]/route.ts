/**
 * GET /api/orders/:id — получить заказ по id (для страниц success/fail и polling).
 */

import { NextResponse } from "next/server";
import { getOrderById } from "@/services/orders";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) {
    return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  }
  return NextResponse.json(order);
}
