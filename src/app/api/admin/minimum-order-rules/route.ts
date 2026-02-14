/**
 * GET — список правил минимального заказа.
 * POST — создать или обновить правило по дате (upsert: date уникален).
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";

async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) throw new Error("unauthorized");
}

const postSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Формат даты: YYYY-MM-DD"),
  minimum_amount: z.number().int().min(0),
});

export async function GET() {
  try {
    await requireAdmin();
    const supabase = getSupabaseAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("minimum_order_rules")
      .select("id, date, minimum_amount, created_at, updated_at")
      .order("date", { ascending: true });
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/minimum-order-rules GET]", e);
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Неверные данные", details: parsed.error.flatten() }, { status: 400 });
    }
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();
    // Upsert: по date уникальному — вставка или обновление
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("minimum_order_rules")
      .upsert(
        {
          date: parsed.data.date,
          minimum_amount: parsed.data.minimum_amount,
          updated_at: now,
        },
        { onConflict: "date" }
      )
      .select()
      .single();
    if (error) throw error;
    revalidateTag("minimum-order-rules", "max");
    return NextResponse.json(data);
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/minimum-order-rules POST]", e);
    return NextResponse.json({ error: "Ошибка сохранения" }, { status: 500 });
  }
}
