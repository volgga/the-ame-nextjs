import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";

async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) throw new Error("unauthorized");
}

const createSchema = z.object({
  category_id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  seo_title: z.string().optional().nullable(),
  seo_description: z.string().optional().nullable(),
  sort_order: z.number().int().optional().nullable(),
  is_active: z.boolean().optional().nullable(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  seo_title: z.string().optional().nullable(),
  seo_description: z.string().optional().nullable(),
  sort_order: z.number().int().optional().nullable(),
  is_active: z.boolean().optional().nullable(),
});

/**
 * GET /api/admin/subcategories?category_id=...
 * Возвращает список подкатегорий для категории
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = request.nextUrl;
    const categoryId = searchParams.get("category_id");

    const supabase = getSupabaseAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from("subcategories")
      .select(
        "id, category_id, name, slug, title, description, seo_title, seo_description, sort_order, is_active, created_at, updated_at"
      );

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    query = query.order("sort_order", { ascending: true, nullsFirst: false }).order("name", { ascending: true });

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/subcategories GET]", e);
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }
}

/**
 * POST /api/admin/subcategories
 * Создаёт новую подкатегорию
 */
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
      .from("subcategories")
      .insert({
        category_id: parsed.data.category_id,
        name: parsed.data.name.trim(),
        slug: parsed.data.slug?.trim() || null,
        title: parsed.data.title?.trim() || null,
        description: parsed.data.description?.trim() || null,
        seo_title: parsed.data.seo_title?.trim() || null,
        seo_description: parsed.data.seo_description?.trim() || null,
        sort_order: parsed.data.sort_order ?? null,
        is_active: parsed.data.is_active ?? true,
      })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/subcategories POST]", e);
    return NextResponse.json({ error: "Ошибка создания" }, { status: 500 });
  }
}
