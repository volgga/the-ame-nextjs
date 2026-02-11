import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";

const aboutPageSchema = z.object({
  title: z.string().nullable().optional(),
  content: z.string().min(1, "Контент обязателен"),
  cover_image_path: z.string().nullable().optional(),
  cover_image_url: z.string().nullable().optional(),
  cover_alt: z.string().nullable().optional(),
  cover_caption: z.string().nullable().optional(),
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

/** GET /api/admin/about-page — получение данных страницы "О нас" */
export async function GET() {
  try {
    await requireAdmin();
    const supabase = getSupabaseAdmin();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).from("about_page").select("*").eq("id", 1).single();

    if (error) {
      if (error.code === "PGRST116") {
        // Запись не найдена, создаём дефолтную
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: newData, error: insertError } = await (supabase as any)
          .from("about_page")
          .insert({
            id: 1,
            content: '<p>Добро пожаловать на страницу "О нас".</p>',
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return NextResponse.json({ page: newData });
      }
      throw error;
    }

    return NextResponse.json({ page: data });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/about-page GET]", e);
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 500 });
  }
}

/** PUT /api/admin/about-page — обновление страницы "О нас" */
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const validated = aboutPageSchema.parse(body);

    const supabase = getSupabaseAdmin();

    // Получаем текущую запись для проверки существования и удаления старого изображения
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingPage, error: fetchError } = await (supabase as any)
      .from("about_page")
      .select("cover_image_path")
      .eq("id", 1)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      throw fetchError;
    }

    // Если меняется изображение и старое существует — удаляем его
    if (
      existingPage?.cover_image_path &&
      validated.cover_image_path !== existingPage.cover_image_path &&
      existingPage.cover_image_path
    ) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).storage.from("blog").remove([existingPage.cover_image_path]);
      } catch (deleteError) {
        console.warn("[admin/about-page PUT] Не удалось удалить старое изображение:", deleteError);
        // Продолжаем обновление даже если удаление изображения не удалось
      }
    }

    // Обновляем или создаём запись
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("about_page")
      .upsert(
        {
          id: 1,
          title: validated.title?.trim() || null,
          content: validated.content.trim(),
          cover_image_path: validated.cover_image_path ?? null,
          cover_image_url: validated.cover_image_url ?? null,
          cover_alt: validated.cover_alt?.trim() || null,
          cover_caption: validated.cover_caption?.trim() || null,
        },
        {
          onConflict: "id",
        }
      )
      .select()
      .single();

    if (error) throw error;

    revalidateTag("about-page");
    return NextResponse.json({ page: data });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message ?? "Ошибка валидации" }, { status: 400 });
    }
    console.error("[admin/about-page PUT]", e);
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 500 });
  }
}
