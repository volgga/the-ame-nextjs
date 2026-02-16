import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";

async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) throw new Error("unauthorized");
}

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  seo_title: z.string().optional().nullable(),
  seo_description: z.string().optional().nullable(),
  sort_order: z.number().int().optional().nullable(),
  is_active: z.boolean().optional().nullable(),
  info_subtitle: z.string().max(500).optional().nullable(),
  info_description: z.string().max(2000).optional().nullable(),
  info_content: z.string().max(50000).optional().nullable(),
  info_image_url: z.string().max(2000).optional().nullable(),
});

/**
 * PATCH /api/admin/subcategories/[id]
 * Обновляет подкатегорию
 */
export async function PATCH(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await _request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Неверные данные", details: parsed.error.flatten() }, { status: 400 });
    }
    const payload: {
      name?: string;
      slug?: string | null;
      title?: string | null;
      description?: string | null;
      seo_title?: string | null;
      seo_description?: string | null;
      sort_order?: number | null;
      is_active?: boolean | null;
      info_subtitle?: string | null;
      info_description?: string | null;
      info_content?: string | null;
      info_image_url?: string | null;
    } = {};
    if (parsed.data.name !== undefined) payload.name = parsed.data.name.trim();
    if (parsed.data.slug !== undefined) payload.slug = parsed.data.slug?.trim() || null;
    if (parsed.data.title !== undefined) payload.title = parsed.data.title?.trim() || null;
    if (parsed.data.description !== undefined) payload.description = parsed.data.description?.trim() || null;
    if (parsed.data.seo_title !== undefined) payload.seo_title = parsed.data.seo_title?.trim() || null;
    if (parsed.data.seo_description !== undefined)
      payload.seo_description = parsed.data.seo_description?.trim() || null;
    if (parsed.data.sort_order !== undefined) payload.sort_order = parsed.data.sort_order ?? null;
    if (parsed.data.is_active !== undefined) payload.is_active = parsed.data.is_active ?? true;
    if (parsed.data.info_subtitle !== undefined) payload.info_subtitle = parsed.data.info_subtitle?.trim() || null;
    if (parsed.data.info_description !== undefined) payload.info_description = parsed.data.info_description?.trim() || null;
    if (parsed.data.info_content !== undefined) payload.info_content = parsed.data.info_content?.trim() || null;
    if (parsed.data.info_image_url !== undefined) payload.info_image_url = parsed.data.info_image_url?.trim() || null;

    const supabase = getSupabaseAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("subcategories")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/subcategories PATCH]", e);
    return NextResponse.json({ error: "Ошибка обновления" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/subcategories/[id]
 * Удаляет подкатегорию
 */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("subcategories").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/subcategories DELETE]", e);
    return NextResponse.json({ error: "Ошибка удаления" }, { status: 500 });
  }
}
