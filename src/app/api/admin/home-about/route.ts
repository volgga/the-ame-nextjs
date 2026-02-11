import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";

async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) throw new Error("unauthorized");
}

const DEFAULT_ABOUT = {
  title: "О нас",
  text: `Цветочный магазин «THE AME»

Цветочный магазин «THE AME» предлагает доставку цветов в Сочи и удобный онлайн-заказ букетов для любого повода. У нас вы можете купить цветы в Сочи с быстрой доставкой — домой, в офис, отель или ресторан. Мы работаем только с свежими цветами и создаём букеты, которые радуют внешним видом и сохраняют свежесть как можно дольше.

В каталоге «THE AME» представлены букеты цветов на любой вкус: классические и авторские композиции, букеты из роз, монобукеты, цветы в коробке и цветы в корзине. Наши флористы внимательно подбирают каждый элемент композиции, учитывая стиль, повод и ваши пожелания. Мы следим за современными тенденциями флористики и регулярно обновляем ассортимент, чтобы вы могли заказать актуальные и стильные букеты.

Доставка цветов по Сочи осуществляется ежедневно и охватывает все основные районы города. Вы можете оформить заказ заранее или в день доставки, выбрать удобное время и добавить открытку с личным текстом. Мы бережно упаковываем каждый букет и контролируем качество на всех этапах — от сборки до передачи получателю.

Цветы с доставкой в Сочи от «THE AME» — это удобный способ поздравить близких, выразить чувства или сделать приятный сюрприз. Закажите букет онлайн и доверьте заботу о деталях профессиональной команде цветочного магазина «THE AME».`,
  imageUrl: null as string | null,
};

export async function GET() {
  try {
    await requireAdmin();
    const supabase = getSupabaseAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("home_reviews")
      .select("about_title, about_text, about_image_url")
      .limit(1)
      .maybeSingle();

    if (error) {
      const isTableMissing =
        error.code === "42P01" ||
        error.message?.includes("Could not find the table") ||
        error.message?.includes("does not exist");

      if (isTableMissing) {
        return NextResponse.json({ ...DEFAULT_ABOUT, _tableMissing: true });
      }
      return NextResponse.json(DEFAULT_ABOUT);
    }

    if (!data) {
      return NextResponse.json(DEFAULT_ABOUT);
    }

    return NextResponse.json({
      title: data.about_title ?? DEFAULT_ABOUT.title,
      text: data.about_text ?? DEFAULT_ABOUT.text,
      imageUrl: data.about_image_url ?? null,
    });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/home-about GET]", e);
    return NextResponse.json(DEFAULT_ABOUT);
  }
}

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  text: z.string().min(1).optional(),
  imageUrl: z.string().nullable().optional(),
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing, error: selectError } = await (supabase as any)
      .from("home_reviews")
      .select("id")
      .limit(1)
      .maybeSingle();

    const isTableMissing =
      selectError &&
      (selectError.code === "42P01" ||
        selectError.message?.includes("Could not find the table") ||
        selectError.message?.includes("does not exist"));

    if (isTableMissing) {
      return NextResponse.json(
        {
          error: "Таблица home_reviews не создана. Выполните миграции из scripts/migrations/",
        },
        { status: 500 }
      );
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (parsed.data.title !== undefined) updateData.about_title = parsed.data.title;
    if (parsed.data.text !== undefined) updateData.about_text = parsed.data.text;
    if (parsed.data.imageUrl !== undefined) updateData.about_image_url = parsed.data.imageUrl;

    if (existing?.id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("home_reviews")
        .update(updateData)
        .eq("id", existing.id)
        .select("about_title, about_text, about_image_url")
        .single();
      if (error) {
        console.error("[admin/home-about PATCH] Ошибка обновления:", error);
        return NextResponse.json({ error: `Ошибка обновления: ${error.message}` }, { status: 500 });
      }
      revalidateTag("home-about");
      return NextResponse.json({
        title: data.about_title ?? DEFAULT_ABOUT.title,
        text: data.about_text ?? DEFAULT_ABOUT.text,
        imageUrl: data.about_image_url ?? null,
      });
    } else {
      // Создаем новую запись
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("home_reviews")
        .insert({
          rating_count: 50,
          review2_text: "Прекрасная мастерская цветов...",
          review3_text: "Всем сердцем люблю Flowerna...",
          about_title: parsed.data.title ?? DEFAULT_ABOUT.title,
          about_text: parsed.data.text ?? DEFAULT_ABOUT.text,
          about_image_url: parsed.data.imageUrl ?? null,
          updated_at: new Date().toISOString(),
        })
        .select("about_title, about_text, about_image_url")
        .single();
      if (error) {
        console.error("[admin/home-about PATCH] Ошибка создания:", error);
        return NextResponse.json({ error: `Ошибка создания: ${error.message}` }, { status: 500 });
      }
      revalidateTag("home-about");
      return NextResponse.json({
        title: data.about_title ?? DEFAULT_ABOUT.title,
        text: data.about_text ?? DEFAULT_ABOUT.text,
        imageUrl: data.about_image_url ?? null,
      });
    }
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/home-about PATCH]", e);
    return NextResponse.json({ error: "Ошибка обновления" }, { status: 500 });
  }
}
