/**
 * GET /api/minimum-order?date=YYYY-MM-DD
 * Возвращает правило минимального заказа на дату: { minimumAmount: number } или null.
 * Для страницы оформления заказа (checkout).
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    if (!date || !DATE_REGEX.test(date)) {
      return NextResponse.json({ minimumAmount: null });
    }
    const supabase = getSupabaseServer();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("minimum_order_rules")
      .select("minimum_amount")
      .eq("date", date)
      .maybeSingle();
    if (error) {
      console.warn("[minimum-order GET]", error.message);
      return NextResponse.json({ minimumAmount: null });
    }
    if (!data || typeof data.minimum_amount !== "number") {
      return NextResponse.json({ minimumAmount: null });
    }
    return NextResponse.json({ minimumAmount: data.minimum_amount });
  } catch (e) {
    console.warn("[minimum-order GET]", e);
    return NextResponse.json({ minimumAmount: null });
  }
}
