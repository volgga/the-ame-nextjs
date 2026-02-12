import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";

async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) throw new Error("unauthorized");
}

const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

const updateSlotSchema = z.object({
  start_time: z.string().regex(timeRegex, "Время начала должно быть в формате HH:MM").optional(),
  end_time: z.string().regex(timeRegex, "Время окончания должно быть в формате HH:MM").optional(),
  sort_order: z.number().int().optional(),
}).refine(
  (data) => {
    if (data.start_time && data.end_time) {
      const [startH, startM] = data.start_time.split(":").map(Number);
      const [endH, endM] = data.end_time.split(":").map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      return startMinutes < endMinutes;
    }
    return true;
  },
  { message: "Время начала должно быть меньше времени окончания" }
);

// PUT /api/admin/delivery-schedule/slots/[slotId] - обновить интервал
export async function PUT(request: NextRequest, { params }: { params: Promise<{ slotId: string }> }) {
  try {
    await requireAdmin();
    const { slotId } = await params;
    const body = await request.json();
    const parsed = updateSlotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Неверные данные", details: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const updateData: { start_time?: string; end_time?: string; sort_order?: number; updated_at: string } = {
      updated_at: new Date().toISOString(),
    };
    if (parsed.data.start_time) updateData.start_time = parsed.data.start_time;
    if (parsed.data.end_time) updateData.end_time = parsed.data.end_time;
    if (parsed.data.sort_order !== undefined) updateData.sort_order = parsed.data.sort_order;

    const { data, error } = await (supabase as any)
      .from("delivery_time_slots")
      .update(updateData)
      .eq("id", slotId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/delivery-schedule/slots/[slotId] PUT]", e);
    return NextResponse.json({ error: "Ошибка обновления интервала" }, { status: 500 });
  }
}

// DELETE /api/admin/delivery-schedule/slots/[slotId] - удалить интервал
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ slotId: string }> }) {
  try {
    await requireAdmin();
    const { slotId } = await params;
    const supabase = getSupabaseAdmin();

    const { error } = await (supabase as any).from("delivery_time_slots").delete().eq("id", slotId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/delivery-schedule/slots/[slotId] DELETE]", e);
    return NextResponse.json({ error: "Ошибка удаления интервала" }, { status: 500 });
  }
}
