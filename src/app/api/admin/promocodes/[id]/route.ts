import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { normalizePromoCode, serializePromoRow } from "@/lib/promoCode";
import { z } from "zod";

async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) throw new Error("unauthorized");
}

const optionalDatetime = z
  .union([z.string().datetime(), z.literal(""), z.null()])
  .optional()
  .nullable()
  .transform((v) => (v === "" || v == null ? null : v));

const updateSchema = z
  .object({
    code: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    discountType: z.enum(["PERCENT", "FIXED"]).optional(),
    value: z.number().positive().optional(),
    isActive: z.boolean().optional(),
    startsAt: optionalDatetime,
    endsAt: optionalDatetime,
  })
  .refine(
    (data) => {
      if (data.discountType === "PERCENT" && data.value != null) return data.value >= 1 && data.value <= 100;
      if (data.discountType === "FIXED" && data.value != null) return data.value >= 1;
      return true;
    },
    { message: "PERCENT: 1–100%, FIXED: ≥ 1 ₽", path: ["value"] }
  )
  .refine(
    (data) => {
      const start = data.startsAt ? new Date(data.startsAt).getTime() : null;
      const end = data.endsAt ? new Date(data.endsAt).getTime() : null;
      if (start != null && end != null && !Number.isNaN(start) && !Number.isNaN(end)) return start <= end;
      return true;
    },
    { message: "Дата начала должна быть не позже даты окончания", path: ["endsAt"] }
  );

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? "Неверные данные";
      return NextResponse.json({ error: msg, details: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (parsed.data.code !== undefined) {
      const code = normalizePromoCode(parsed.data.code);
      // Уникальность: другой запись с таким code не должна существовать
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing } = await (supabase as any)
        .from("promo_codes")
        .select("id")
        .eq("code", code)
        .neq("id", id)
        .maybeSingle();
      if (existing) {
        return NextResponse.json({ error: "Промокод с таким кодом уже существует" }, { status: 409 });
      }
      payload.code = code;
    }
    if (parsed.data.name !== undefined) payload.name = parsed.data.name.trim();
    if (parsed.data.discountType !== undefined) payload.discount_type = parsed.data.discountType;
    if (parsed.data.value !== undefined) payload.value = parsed.data.value;
    if (parsed.data.isActive !== undefined) payload.is_active = parsed.data.isActive;
    if (parsed.data.startsAt !== undefined) payload.starts_at = parsed.data.startsAt;
    if (parsed.data.endsAt !== undefined) payload.ends_at = parsed.data.endsAt;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("promo_codes")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Не найдено" }, { status: 404 });

    return NextResponse.json(serializePromoRow(data as Record<string, unknown>));
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/promocodes PATCH]", e);
    return NextResponse.json({ error: "Ошибка обновления" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("promo_codes").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/promocodes DELETE]", e);
    return NextResponse.json({ error: "Ошибка удаления" }, { status: 500 });
  }
}
