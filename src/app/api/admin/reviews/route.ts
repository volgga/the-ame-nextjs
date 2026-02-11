import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";

async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) throw new Error("unauthorized");
}

const DEFAULT_REVIEWS_DATA = {
  id: null,
  rating_count: 50,
  review2_text:
    "Прекрасная мастерская цветов. Заказываю букеты не первый раз. Все очень стильно, красиво, качественно. Радует глаз и согревает душу. Все, кому я дарю букеты от Flowerna, в восторге! Однозначная рекомендация. Помимо качества и стиля, всегда все четко и вовремя. Что тоже очень и очень важно. Спасибо за то, что дарите красоту и хорошее настроение",
  review3_text:
    "Всем сердцем люблю Flowerna ❤️ Цветочный с особенной, теплой атмосферой 😊 Букеты как произведение искусства, каждый создан с душой и тонким чувством прекрасного 😊 Сервис Flowerna – это высший уровень, такого дружелюбного и молниеносного взаимодействия с клиентом я ранее не встречала 😊 Flowerna, Вы просто разрыв сердца ❤️ Желаю процветания такому крутому бизнесу!!! ❤️",
};

export async function GET() {
  try {
    await requireAdmin();
    const supabase = getSupabaseAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("home_reviews")
      .select("id, rating_count, review2_text, review3_text")
      .limit(1)
      .maybeSingle();

    if (error) {
      // Таблица не существует
      if (error.code === "42P01" || error.message?.includes("Could not find the table")) {
        console.warn("[admin/reviews GET] Таблица home_reviews не существует. Нужно выполнить миграцию.");
        // Возвращаем дефолты, но с флагом, что таблица не создана
        return NextResponse.json({
          ...DEFAULT_REVIEWS_DATA,
          _tableMissing: true,
        });
      }
      // Нет записей
      if (error.code === "PGRST116") {
        console.warn("[admin/reviews GET] Нет записей, возвращаем дефолты");
        return NextResponse.json(DEFAULT_REVIEWS_DATA);
      }
      console.error("[admin/reviews GET] Ошибка БД:", error.code, error.message);
      // При любой другой ошибке тоже возвращаем дефолты, чтобы UI не падал
      return NextResponse.json(DEFAULT_REVIEWS_DATA);
    }

    // Если данных нет, возвращаем дефолты
    if (!data) {
      return NextResponse.json(DEFAULT_REVIEWS_DATA);
    }

    // Нормализуем данные - подставляем дефолты для null/undefined
    return NextResponse.json({
      id: data.id ?? null,
      rating_count: data.rating_count ?? DEFAULT_REVIEWS_DATA.rating_count,
      review2_text: data.review2_text ?? DEFAULT_REVIEWS_DATA.review2_text,
      review3_text: data.review3_text ?? DEFAULT_REVIEWS_DATA.review3_text,
    });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/reviews GET] Исключение:", e);
    // При любом исключении возвращаем дефолты
    return NextResponse.json(DEFAULT_REVIEWS_DATA);
  }
}

const updateSchema = z.object({
  rating_count: z.number().int().min(0).optional(),
  review2_text: z.string().min(1).optional(),
  review3_text: z.string().min(1).optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Неверные данные", details: parsed.error.flatten() }, { status: 400 });
    }
    const supabase = getSupabaseAdmin();

    // Пытаемся найти существующую запись (может не быть, если таблица пустая)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing, error: selectError } = await (supabase as any)
      .from("home_reviews")
      .select("id")
      .limit(1)
      .maybeSingle();

    // Если таблица не существует - возвращаем понятную ошибку
    const isTableMissing =
      selectError &&
      (selectError.code === "42P01" ||
        selectError.message?.includes("Could not find the table") ||
        selectError.message?.includes("does not exist"));

    if (isTableMissing) {
      console.error("[admin/reviews PATCH] Таблица home_reviews не существует. Нужно выполнить миграцию.");
      return NextResponse.json(
        {
          error:
            "Таблица home_reviews не создана в базе данных. Выполните миграцию из scripts/migrations/home-reviews.sql в Supabase SQL Editor. Подробная инструкция: scripts/migrations/README-home-reviews.md",
        },
        { status: 500 }
      );
    }

    // Если нет записей или ошибка PGRST116 - создаем новую запись
    if (selectError && selectError.code === "PGRST116") {
      // Нет записей - создаем новую
      const insertData = {
        rating_count: parsed.data.rating_count ?? DEFAULT_REVIEWS_DATA.rating_count,
        review2_text: parsed.data.review2_text ?? DEFAULT_REVIEWS_DATA.review2_text,
        review3_text: parsed.data.review3_text ?? DEFAULT_REVIEWS_DATA.review3_text,
        updated_at: new Date().toISOString(),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).from("home_reviews").insert(insertData).select().single();
      if (error) {
        console.error("[admin/reviews PATCH] Ошибка создания записи:", error.code, error.message, error.details);
        return NextResponse.json(
          { error: `Ошибка создания: ${error.message || "Неизвестная ошибка"}` },
          { status: 500 }
        );
      }
      revalidateTag("home-reviews", "max");
      return NextResponse.json(data);
    }

    // Если была другая ошибка при выборке
    if (selectError) {
      console.error("[admin/reviews PATCH] Ошибка при выборке записи:", selectError.code, selectError.message);
      return NextResponse.json(
        { error: `Ошибка доступа к данным: ${selectError.message || "Неизвестная ошибка"}` },
        { status: 500 }
      );
    }

    if (existing?.id) {
      // Обновляем существующую запись
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (parsed.data.rating_count !== undefined) updateData.rating_count = parsed.data.rating_count;
      if (parsed.data.review2_text !== undefined) updateData.review2_text = parsed.data.review2_text;
      if (parsed.data.review3_text !== undefined) updateData.review3_text = parsed.data.review3_text;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("home_reviews")
        .update(updateData)
        .eq("id", existing.id)
        .select()
        .single();
      if (error) {
        console.error("[admin/reviews PATCH] Ошибка обновления записи:", error.code, error.message, error.details);
        return NextResponse.json(
          { error: `Ошибка обновления: ${error.message || "Неизвестная ошибка"}` },
          { status: 500 }
        );
      }
      revalidateTag("home-reviews", "max");
      return NextResponse.json(data);
    } else {
      // Нет записи - создаем новую
      const insertData = {
        rating_count: parsed.data.rating_count ?? DEFAULT_REVIEWS_DATA.rating_count,
        review2_text: parsed.data.review2_text ?? DEFAULT_REVIEWS_DATA.review2_text,
        review3_text: parsed.data.review3_text ?? DEFAULT_REVIEWS_DATA.review3_text,
        updated_at: new Date().toISOString(),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).from("home_reviews").insert(insertData).select().single();
      if (error) {
        console.error("[admin/reviews PATCH] Ошибка создания записи:", error.code, error.message, error.details);
        return NextResponse.json(
          { error: `Ошибка создания: ${error.message || "Неизвестная ошибка"}` },
          { status: 500 }
        );
      }
      revalidateTag("home-reviews", "max");
      return NextResponse.json(data);
    }
  } catch (e) {
    const error = e as Error;
    if (error.message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/reviews PATCH] Неожиданное исключение:", error.message, error.stack);
    return NextResponse.json({ error: `Ошибка обновления: ${error.message || "Неизвестная ошибка"}` }, { status: 500 });
  }
}
