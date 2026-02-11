import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";

async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) throw new Error("unauthorized");
}

const buttonVariantSchema = z.enum(["filled", "transparent"]).optional().nullable();
const buttonAlignSchema = z.enum(["left", "center", "right"]).optional().nullable();

const updateSchema = z
  .object({
    image_url: z.string().min(1).optional(),
    sort_order: z.number().int().optional(),
    is_active: z.boolean().optional(),
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

export async function PATCH(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await _request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Неверные данные", details: parsed.error.flatten() }, { status: 400 });
    }
    const supabase = getSupabaseAdmin();
    const payload: Record<string, unknown> = { ...parsed.data, updated_at: new Date().toISOString() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- hero_slides нет в сгенерированных Supabase типах
    const { data, error } = await (supabase as any).from("hero_slides").update(payload).eq("id", id).select().single();
    if (error) throw error;
    revalidateTag("hero-slides");
    return NextResponse.json(data);
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/slides PATCH]", e);
    return NextResponse.json({ error: "Ошибка обновления" }, { status: 500 });
  }
}

const BUCKET = "hero-slides";

/** Извлечь path в bucket из публичного URL Supabase Storage */
function getStoragePathFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const match = u.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const supabase = getSupabaseAdmin();

    // Получить slide для image_url
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- hero_slides нет в сгенерированных Supabase типах
    const { data: slide } = await (supabase as any).from("hero_slides").select("image_url").eq("id", id).single();

    if (slide?.image_url) {
      const path = getStoragePathFromUrl(slide.image_url);
      if (path && !path.includes("..")) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).storage.from(BUCKET).remove([path]);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- hero_slides нет в сгенерированных Supabase типах
    const { error } = await (supabase as any).from("hero_slides").delete().eq("id", id);
    if (error) throw error;
    revalidateTag("hero-slides");
    return NextResponse.json({ success: true });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/slides DELETE]", e);
    return NextResponse.json({ error: "Ошибка удаления" }, { status: 500 });
  }
}
