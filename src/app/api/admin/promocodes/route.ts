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

const createSchema = z
  .object({
    code: z.string().min(1, "Код обязателен"),
    name: z.string().min(1, "Название обязательно"),
    discountType: z.enum(["PERCENT", "FIXED"]),
    value: z.number().positive("Значение должно быть больше 0"),
    isActive: z.boolean().default(true),
    startsAt: optionalDatetime,
    endsAt: optionalDatetime,
  })
  .refine(
    (data) => {
      if (data.discountType === "PERCENT") return data.value >= 1 && data.value <= 100;
      return data.value >= 1;
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

/** Код/сообщение ошибки Supabase при отсутствии таблицы. */
function isTableMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const msg = String((error as { message?: string }).message ?? "");
  const code = String((error as { code?: string }).code ?? "");
  return (
    code === "42P01" ||
    code === "PGRST116" ||
    msg.includes("does not exist") ||
    msg.includes("не найден") ||
    msg.toLowerCase().includes("could not find the table")
  );
}

export async function GET() {
  try {
    await requireAdmin();
    const supabase = getSupabaseAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("promo_codes")
      .select("id, code, name, discount_type, value, is_active, starts_at, ends_at, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) {
      if (isTableMissingError(error)) {
        return NextResponse.json([]);
      }
      throw error;
    }

    const items = (data ?? []).map((row: Record<string, unknown>) => serializePromoRow(row));
    return NextResponse.json(items);
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/promocodes GET]", e);
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Неверный JSON в теле запроса" }, { status: 400 });
    }
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? "Неверные данные";
      return NextResponse.json({ error: msg, details: parsed.error.flatten() }, { status: 400 });
    }

    const code = normalizePromoCode(parsed.data.code);
    const supabase = getSupabaseAdmin();

    // Проверка уникальности кода
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any).from("promo_codes").select("id").eq("code", code).maybeSingle();
    if (existing) {
      return NextResponse.json({ error: "Промокод с таким кодом уже существует" }, { status: 409 });
    }

    const insert: Record<string, unknown> = {
      code,
      name: parsed.data.name.trim(),
      discount_type: parsed.data.discountType,
      value: parsed.data.value,
      is_active: parsed.data.isActive,
      starts_at: parsed.data.startsAt ?? null,
      ends_at: parsed.data.endsAt ?? null,
      updated_at: new Date().toISOString(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).from("promo_codes").insert(insert).select().single();

    if (error) throw error;
    if (!data) throw new Error("Insert succeeded but no row returned");

    return NextResponse.json(serializePromoRow(data as Record<string, unknown>), { status: 201 });
  } catch (e) {
    if (e && typeof e === "object" && "message" in e && (e as { message?: string }).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    const message =
      e instanceof Error
        ? e.message
        : e && typeof e === "object" && "message" in e
          ? String((e as { message?: unknown }).message ?? "Ошибка создания")
          : "Ошибка создания";
    console.error("[admin/promocodes POST]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
