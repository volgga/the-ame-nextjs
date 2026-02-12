import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";

async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) throw new Error("unauthorized");
}

const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

const createSlotSchema = z.object({
  start_time: z.string().regex(timeRegex, "Время начала должно быть в формате HH:MM"),
  end_time: z.string().regex(timeRegex, "Время окончания должно быть в формате HH:MM"),
}).refine(
  (data) => {
    const [startH, startM] = data.start_time.split(":").map(Number);
    const [endH, endM] = data.end_time.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    return startMinutes < endMinutes;
  },
  { message: "Время начала должно быть меньше времени окончания" }
);

// POST /api/admin/delivery-schedule/days/[id]/slots - добавить интервал к дню
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const parsed = createSlotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Неверные данные", details: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Проверяем, что день существует
    const { data: day } = await (supabase as any)
      .from("delivery_days")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (!day) {
      return NextResponse.json({ error: "День не найден" }, { status: 404 });
    }

    // Получаем максимальный sort_order для этого дня
    const { data: maxSlot } = await (supabase as any)
      .from("delivery_time_slots")
      .select("sort_order")
      .eq("day_id", id)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const sortOrder = maxSlot?.sort_order != null ? maxSlot.sort_order + 1 : 0;

    const { data, error } = await (supabase as any)
      .from("delivery_time_slots")
      .insert({
        day_id: id,
        start_time: parsed.data.start_time,
        end_time: parsed.data.end_time,
        sort_order: sortOrder,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/delivery-schedule/days/[id]/slots POST]", e);
    return NextResponse.json({ error: "Ошибка создания интервала" }, { status: 500 });
  }
}
