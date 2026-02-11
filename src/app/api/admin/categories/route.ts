import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { slugify } from "@/utils/slugify";
import { z } from "zod";

async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) throw new Error("unauthorized");
}

/**
 * GET: список категорий ТОЛЬКО из таблицы `categories`.
 * Единственный допустимый источник для раздела «Доп товары» и др.
 * Возвращаются только строки с непустым slug из БД (без генерации, без fallback).
 */
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("categories")
      .select("id, name, slug, sort_order, is_active, description, seo_title, flower_sections")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    const rows = (data ?? []) as {
      id: string;
      name: string | null;
      slug: string | null;
      sort_order: number;
      is_active: boolean;
      description: string | null;
      seo_title: string | null;
      flower_sections?: unknown;
    }[];
    const list = rows
      .filter((r) => typeof r.slug === "string" && r.slug.trim() !== "")
      .map((r) => ({
        id: String(r.id),
        name: r.name ?? "",
        slug: String(r.slug).trim(),
        sort_order: r.sort_order ?? 0,
        is_active: r.is_active ?? true,
        description: r.description ?? null,
        seo_title: r.seo_title ?? null,
        flower_sections: Array.isArray(r.flower_sections) ? r.flower_sections : null,
      }));
    return NextResponse.json(list);
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/categories GET]", e);
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }
}

/** Допустимый формат slug: только латиница, цифры, дефис */
const SLUG_REGEX = /^[a-z0-9-]+$/;

const flowerSectionSchema = z.object({
  key: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
});

const createSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  is_active: z.boolean().default(true),
  description: z.string().max(5000).optional().nullable(),
  seo_title: z.string().max(200).optional().nullable(),
  flower_sections: z.array(flowerSectionSchema).optional().nullable(),
});

/** Находит уникальный slug: base, base-2, base-3, ... */
async function ensureUniqueSlug(supabase: ReturnType<typeof getSupabaseAdmin>, baseSlug: string): Promise<string> {
  let candidate = baseSlug;
  let n = 1;
  for (;;) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("categories")
      .select("id")
      .eq("slug", candidate)
      .limit(1)
      .maybeSingle();
    if (!data) return candidate;
    candidate = `${baseSlug}-${++n}`;
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Неверные данные", details: parsed.error.flatten() }, { status: 400 });
    }
    const supabase = getSupabaseAdmin();
    const rawSlug = (parsed.data.slug && parsed.data.slug.trim()) || slugify(parsed.data.name) || "category";
    const baseSlug = rawSlug.trim();
    if (!SLUG_REGEX.test(baseSlug)) {
      return NextResponse.json(
        { error: "Slug может содержать только латинские буквы, цифры и дефис (a-z, 0-9, -)." },
        { status: 400 }
      );
    }
    const slug = await ensureUniqueSlug(supabase, baseSlug);

    // sort_order: ставим в конец (по текущему max + 1 или 0)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from("categories")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const sort_order = existing?.sort_order != null ? existing.sort_order + 1 : 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("categories")
      .insert({
        name: parsed.data.name.trim(),
        slug,
        sort_order,
        is_active: parsed.data.is_active,
        description: parsed.data.description?.trim() || null,
        seo_title: parsed.data.seo_title?.trim() || null,
        flower_sections:
          Array.isArray(parsed.data.flower_sections) && parsed.data.flower_sections.length > 0
            ? parsed.data.flower_sections
            : null,
      })
      .select()
      .single();
    if (error) throw error;
    revalidateTag("categories", "max");
    revalidateTag("catalog-products", "max");
    revalidateTag("add-on-products", "max");
    return NextResponse.json(data);
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/categories POST]", e);
    return NextResponse.json({ error: "Ошибка создания" }, { status: 500 });
  }
}
