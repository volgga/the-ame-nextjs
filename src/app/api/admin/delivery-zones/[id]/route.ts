import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";

async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) throw new Error("unauthorized");
}

const updateSchema = z.object({
  zone_title: z.string().min(1).optional(),
  paid_up_to: z.number().int().min(0).optional(),
  delivery_price: z.number().int().min(0).optional(),
  free_from: z.number().int().min(0).optional(),
  subareas_text: z.string().optional().nullable(),
});

export async function PATCH(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await _request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Неверные данные", details: parsed.error.flatten() }, { status: 400 });
    }
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (parsed.data.zone_title !== undefined) payload.zone_title = parsed.data.zone_title.trim();
    if (parsed.data.paid_up_to !== undefined) payload.paid_up_to = parsed.data.paid_up_to;
    if (parsed.data.delivery_price !== undefined) payload.delivery_price = parsed.data.delivery_price;
    if (parsed.data.free_from !== undefined) payload.free_from = parsed.data.free_from;
    if (parsed.data.subareas_text !== undefined) payload.subareas_text = parsed.data.subareas_text?.trim() || null;

    const supabase = getSupabaseAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("delivery_zones")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    revalidateTag("delivery-zones");
    return NextResponse.json(data);
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/delivery-zones PATCH]", e);
    return NextResponse.json({ error: "Ошибка обновления" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("delivery_zones").delete().eq("id", id);
    if (error) throw error;
    revalidateTag("delivery-zones");
    return NextResponse.json({ success: true });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/delivery-zones DELETE]", e);
    return NextResponse.json({ error: "Ошибка удаления" }, { status: 500 });
  }
}
