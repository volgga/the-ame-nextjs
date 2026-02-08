import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";

async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) throw new Error("unauthorized");
}

/** Допустимый формат slug: только латиница, цифры, дефис */
const SLUG_REGEX = /^[a-z0-9-]+$/;

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  is_active: z.boolean().optional(),
  description: z.string().max(5000).optional().nullable(),
  seo_title: z.string().max(200).optional().nullable(),
});

/** Уникальный slug; если занят другой записью (не excludeId), добавляем -2, -3, ... */
async function ensureUniqueSlugExcept(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  baseSlug: string,
  excludeId: string
): Promise<string> {
  let candidate = baseSlug.trim();
  let n = 1;
  for (;;) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("categories")
      .select("id")
      .eq("slug", candidate)
      .limit(1)
      .maybeSingle();
    if (!data || String(data.id) === excludeId) return candidate;
    candidate = `${baseSlug.trim()}-${++n}`;
  }
}

export async function PATCH(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await _request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Неверные данные", details: parsed.error.flatten() }, { status: 400 });
    }
    const payload: { name?: string; slug?: string; is_active?: boolean; description?: string | null; seo_title?: string | null } = {};
    if (parsed.data.name !== undefined) payload.name = parsed.data.name.trim();
    if (parsed.data.is_active !== undefined) payload.is_active = parsed.data.is_active;
    if (parsed.data.description !== undefined) payload.description = parsed.data.description?.trim() || null;
    if (parsed.data.seo_title !== undefined) payload.seo_title = parsed.data.seo_title?.trim() || null;

    if (parsed.data.slug !== undefined) {
      const slugTrimmed = parsed.data.slug.trim();
      if (!SLUG_REGEX.test(slugTrimmed)) {
        return NextResponse.json(
          { error: "Slug может содержать только латинские буквы, цифры и дефис (a-z, 0-9, -)." },
          { status: 400 }
        );
      }
      payload.slug = await ensureUniqueSlugExcept(getSupabaseAdmin(), slugTrimmed, id);
    }

    const supabase = getSupabaseAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).from("categories").update(payload).eq("id", id).select().single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/categories PATCH]", e);
    return NextResponse.json({ error: "Ошибка обновления" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("categories").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/categories DELETE]", e);
    return NextResponse.json({ error: "Ошибка удаления" }, { status: 500 });
  }
}
