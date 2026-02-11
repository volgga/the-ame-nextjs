import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
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

type RouteParams = {
  params: Promise<{ id: string }>;
};

/** GET /api/admin/blog/[id] — получение одного поста */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;
    const supabase = getSupabaseAdmin();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).from("blog_posts").select("*").eq("id", id).single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Пост не найден" }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ post: data });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/blog/[id] GET]", e);
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 500 });
  }
}

/** PUT /api/admin/blog/[id] — обновление поста */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const validated = blogPostSchema.parse(body);

    const supabase = getSupabaseAdmin();

    // Проверка уникальности slug (если slug изменился)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: currentPost } = await (supabase as any).from("blog_posts").select("slug").eq("id", id).single();

    if (currentPost && currentPost.slug !== validated.slug) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingPost } = await (supabase as any)
        .from("blog_posts")
        .select("id")
        .eq("slug", validated.slug)
        .neq("id", id)
        .maybeSingle();

      if (existingPost) {
        return NextResponse.json({ error: `Пост с slug "${validated.slug}" уже существует` }, { status: 400 });
      }
    }

    // Получаем текущий пост для проверки существования и удаления старого изображения
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingPost, error: fetchError } = await (supabase as any)
      .from("blog_posts")
      .select("cover_image_path")
      .eq("id", id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json({ error: "Пост не найден" }, { status: 404 });
      }
      throw fetchError;
    }

    // Если меняется изображение и старое существует — удаляем его
    if (
      existingPost?.cover_image_path &&
      validated.cover_image_path !== existingPost.cover_image_path &&
      existingPost.cover_image_path
    ) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).storage.from("blog").remove([existingPost.cover_image_path]);
      } catch (deleteError) {
        console.warn("[admin/blog/[id] PUT] Не удалось удалить старое изображение:", deleteError);
        // Продолжаем обновление даже если удаление изображения не удалось
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("blog_posts")
      .update({
        title: validated.title,
        slug: validated.slug,
        content: validated.content,
        excerpt: validated.excerpt?.trim() || null,
        cover_image_path: validated.cover_image_path ?? null,
        cover_image_url: validated.cover_image_url ?? null,
        cover_alt: validated.cover_alt ?? null,
        cover_caption: validated.cover_caption ?? null,
        published: validated.published ?? false,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    revalidateTag("blog-posts", "max");
    revalidatePath("/clients/blog");
    revalidatePath(`/clients/blog/${data.slug}`);
    return NextResponse.json({ post: data });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message ?? "Ошибка валидации" }, { status: 400 });
    }
    console.error("[admin/blog/[id] PUT]", e);
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 500 });
  }
}

/** DELETE /api/admin/blog/[id] — удаление поста */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;
    const supabase = getSupabaseAdmin();

    // Получаем пост для удаления изображения
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: post, error: fetchError } = await (supabase as any)
      .from("blog_posts")
      .select("cover_image_path")
      .eq("id", id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json({ error: "Пост не найден" }, { status: 404 });
      }
      throw fetchError;
    }

    // Удаляем изображение если есть
    if (post?.cover_image_path) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).storage.from("blog").remove([post.cover_image_path]);
      } catch (deleteError) {
        console.warn("[admin/blog/[id] DELETE] Не удалось удалить изображение:", deleteError);
        // Продолжаем удаление поста даже если удаление изображения не удалось
      }
    }

    // Удаляем пост
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("blog_posts").delete().eq("id", id);

    if (error) throw error;

    revalidateTag("blog-posts", "max");
    revalidatePath("/clients/blog");
    return NextResponse.json({ success: true });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/blog/[id] DELETE]", e);
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 500 });
  }
}
