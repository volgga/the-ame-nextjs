import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";

async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    throw new Error("unauthorized");
  }
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("hero_slides")
      .select("id, image_url, sort_order, is_active, button_text, button_href, button_variant, button_align")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/slides GET]", e);
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }
}

const buttonVariantSchema = z.enum(["filled", "transparent"]).optional().nullable();
const buttonAlignSchema = z.enum(["left", "center", "right"]).optional().nullable();

const createSchema = z
  .object({
    image_url: z.string().min(1),
    sort_order: z.number().int().default(0),
    is_active: z.boolean().default(true),
    button_text: z.string().optional().nullable(),
    button_href: z.string().optional().nullable(),
    button_variant: buttonVariantSchema,
    button_align: buttonAlignSchema,
  })
  .refine(
    (data) => {
      const hasText = Boolean(data.button_text?.trim());
      const hasHref = Boolean(data.button_href?.trim());
      if (!hasText && !hasHref) return true;
      return hasText && hasHref;
    },
    { message: "Для кнопки нужно указать и текст, и ссылку (или оба оставить пустыми)", path: ["button_text"] }
  );

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Неверные данные", details: parsed.error.flatten() }, { status: 400 });
    }
    const supabase = getSupabaseAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("hero_slides")
      .insert({
        ...parsed.data,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/slides POST]", e);
    return NextResponse.json({ error: "Ошибка создания" }, { status: 500 });
  }
}
