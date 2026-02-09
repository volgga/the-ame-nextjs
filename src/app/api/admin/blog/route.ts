import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { slugify } from "@/utils/slugify";
import { z } from "zod";

const blogPostSchema = z.object({
  title: z.string().min(1, "Заголовок обязателен"),
  slug: z.string().min(1, "Slug обязателен"),
  content: z.string().min(1, "Текст обязателен"),
  excerpt: z.string().max(200).nullable().optional(),
  cover_image_path: z.string().nullable().optional(),
  cover_image_url: z.string().nullable().optional(),
  cover_alt: z.string().nullable().optional(),
  cover_caption: z.string().nullable().optional(),
  published: z.boolean().default(false),
  sort_order: z.number().int().min(0).nullable().optional(),
});

async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) throw new Error("unauthorized");
}

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "object" && e !== null) {
    const obj = e as Record<string, unknown>;
    if (typeof obj.message === "string") {
      let msg = obj.message;
      if (typeof obj.hint === "string" && obj.hint) {
        msg += ` (${obj.hint})`;
      }
      if (typeof obj.details === "string" && obj.details) {
        msg += ` — ${obj.details}`;
      }
      return msg;
    }
  }
  return "Ошибка операции";
}

/** GET /api/admin/blog — список всех постов (включая черновики) */
export async function GET() {
  try {
    await requireAdmin();
    const supabase = getSupabaseAdmin();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("blog_posts")
      .select("*")
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ posts: data ?? [] });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/blog GET]", e);
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 500 });
  }
}

/** POST /api/admin/blog — создание нового поста */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const validated = blogPostSchema.parse(body);

    const supabase = getSupabaseAdmin();

    // Проверка уникальности slug
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingPost } = await (supabase as any)
      .from("blog_posts")
      .select("id")
      .eq("slug", validated.slug)
      .maybeSingle();

    if (existingPost) {
      return NextResponse.json({ error: `Пост с slug "${validated.slug}" уже существует` }, { status: 400 });
    }

    // Для нового поста: если sort_order не указан, ставим его в начало списка (минимальный order)
    // Получаем минимальный sort_order среди всех постов
    let sortOrder = validated.sort_order;
    if (sortOrder === null || sortOrder === undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: posts } = await (supabase as any)
        .from("blog_posts")
        .select("sort_order")
        .order("sort_order", { ascending: true, nullsFirst: false })
        .limit(1);

      // Если есть посты с sort_order, новый пост будет на позиции min - 1 (сверху)
      // Если постов нет или все с null, начинаем с 0
      if (posts && posts.length > 0 && posts[0].sort_order !== null) {
        sortOrder = Math.max(0, posts[0].sort_order - 1);
      } else {
        sortOrder = 0;
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("blog_posts")
      .insert({
        title: validated.title,
        slug: validated.slug,
        content: validated.content,
        excerpt: validated.excerpt?.trim() || null,
        cover_image_path: validated.cover_image_path ?? null,
        cover_image_url: validated.cover_image_url ?? null,
        cover_alt: validated.cover_alt ?? null,
        cover_caption: validated.cover_caption ?? null,
        published: validated.published ?? false,
        sort_order: sortOrder,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ post: data }, { status: 201 });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message ?? "Ошибка валидации" }, { status: 400 });
    }
    console.error("[admin/blog POST]", e);
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 500 });
  }
}
