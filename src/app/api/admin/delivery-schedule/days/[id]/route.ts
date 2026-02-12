import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";

async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) throw new Error("unauthorized");
}

const updateDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Дата должна быть в формате YYYY-MM-DD").optional(),
});

// PUT /api/admin/delivery-schedule/days/[id] - обновить день (изменить дату)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const parsed = updateDaySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Неверные данные", details: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    if (parsed.data.date) {
      // Проверяем, что дата не в прошлом
      const dateObj = new Date(parsed.data.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dateObj < today) {
        return NextResponse.json({ error: "Нельзя устанавливать дату в прошлом" }, { status: 400 });
      }

      // Проверяем, что такой день еще не существует (кроме текущего)
      const { data: existing } = await (supabase as any)
        .from("delivery_days")
        .select("id")
        .eq("date", parsed.data.date)
        .neq("id", id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ error: "День с такой датой уже существует" }, { status: 400 });
      }
    }

    const updateData: { date?: string; updated_at: string } = {
      updated_at: new Date().toISOString(),
    };
    if (parsed.data.date) {
      updateData.date = parsed.data.date;
    }

    const { data, error } = await (supabase as any)
      .from("delivery_days")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Получаем интервалы для этого дня
    const { data: slots } = await (supabase as any)
      .from("delivery_time_slots")
      .select("*")
      .eq("day_id", id)
      .order("sort_order", { ascending: true });

    return NextResponse.json({ ...data, time_slots: slots || [] });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/delivery-schedule/days/[id] PUT]", e);
    return NextResponse.json({ error: "Ошибка обновления" }, { status: 500 });
  }
}

// DELETE /api/admin/delivery-schedule/days/[id] - удалить день (каскадно удалит интервалы)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const supabase = getSupabaseAdmin();

    const { error } = await (supabase as any).from("delivery_days").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/delivery-schedule/days/[id] DELETE]", e);
    return NextResponse.json({ error: "Ошибка удаления" }, { status: 500 });
  }
}
