import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";

async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) throw new Error("unauthorized");
}

const createDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Дата должна быть в формате YYYY-MM-DD"),
});

export interface DeliveryDay {
  id: string;
  date: string;
  created_at: string;
  updated_at: string;
  time_slots?: DeliveryTimeSlot[];
}

export interface DeliveryTimeSlot {
  id: string;
  day_id: string;
  start_time: string;
  end_time: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// GET /api/admin/delivery-schedule - получить все дни с интервалами
export async function GET() {
  try {
    await requireAdmin();
    const supabase = getSupabaseAdmin();

    // Получаем все дни, отсортированные по дате
    const { data: days, error: daysError } = await (supabase as any)
      .from("delivery_days")
      .select("*")
      .order("date", { ascending: true });

    if (daysError) throw daysError;

    if (!days || days.length === 0) {
      return NextResponse.json([]);
    }

    // Получаем все интервалы для этих дней
    const dayIds = days.map((d: DeliveryDay) => d.id);
    const { data: slots, error: slotsError } = await (supabase as any)
      .from("delivery_time_slots")
      .select("*")
      .in("day_id", dayIds)
      .order("sort_order", { ascending: true });

    if (slotsError) throw slotsError;

    // Группируем интервалы по дням
    const daysWithSlots: DeliveryDay[] = days.map((day: DeliveryDay) => ({
      ...day,
      time_slots: (slots || []).filter((slot: DeliveryTimeSlot) => slot.day_id === day.id),
    }));

    return NextResponse.json(daysWithSlots);
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/delivery-schedule GET]", e);
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }
}

// POST /api/admin/delivery-schedule - создать новый день
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = createDaySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Неверные данные", details: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Проверяем, что дата не в прошлом
    const dateObj = new Date(parsed.data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateObj < today) {
      return NextResponse.json({ error: "Нельзя добавлять даты в прошлом" }, { status: 400 });
    }

    // Проверяем, что такой день еще не существует
    const { data: existing } = await (supabase as any)
      .from("delivery_days")
      .select("id")
      .eq("date", parsed.data.date)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "День с такой датой уже существует" }, { status: 400 });
    }

    const { data, error } = await (supabase as any)
      .from("delivery_days")
      .insert({
        date: parsed.data.date,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ...data, time_slots: [] });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/delivery-schedule POST]", e);
    return NextResponse.json({ error: "Ошибка создания" }, { status: 500 });
  }
}
