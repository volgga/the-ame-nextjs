import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";

async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) throw new Error("unauthorized");
}

const DEFAULT_ORDER_BLOCK = {
  title: "Заказать букет вашей мечты",
  subtitle1: "",
  text: "Соберём букет вашей мечты и доставим по Сочи уже сегодня. Оставьте заявку на сайте или позвоните нам — мы подберём идеальное сочетание цветов под ваш повод и бюджет.",
  imageUrl: null as string | null,
};

export async function GET() {
  try {
    await requireAdmin();
    const supabase = getSupabaseAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("home_reviews")
      .select("order_block_title, order_block_subtitle1, order_block_text, order_block_image_url")
      .limit(1)
      .maybeSingle();

    if (error) {
      const isTableMissing =
        error.code === "42P01" ||
        error.message?.includes("Could not find the table") ||
        error.message?.includes("does not exist");

      if (isTableMissing) {
        return NextResponse.json({ ...DEFAULT_ORDER_BLOCK, _tableMissing: true });
      }
      return NextResponse.json(DEFAULT_ORDER_BLOCK);
    }

    if (!data) {
      return NextResponse.json(DEFAULT_ORDER_BLOCK);
    }

    return NextResponse.json({
      title: data.order_block_title ?? DEFAULT_ORDER_BLOCK.title,
      subtitle1: data.order_block_subtitle1 ?? DEFAULT_ORDER_BLOCK.subtitle1,
      text: data.order_block_text ?? DEFAULT_ORDER_BLOCK.text,
      imageUrl: data.order_block_image_url ?? null,
    });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/home-order-block GET]", e);
    return NextResponse.json(DEFAULT_ORDER_BLOCK);
  }
}

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  subtitle1: z.string().optional(),
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
        { error: "Таблица home_reviews не создана. Выполните миграции из scripts/migrations/" },
        { status: 500 }
      );
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (parsed.data.title !== undefined) updateData.order_block_title = parsed.data.title;
    if (parsed.data.subtitle1 !== undefined) updateData.order_block_subtitle1 = parsed.data.subtitle1;
    if (parsed.data.text !== undefined) updateData.order_block_text = parsed.data.text;
    if (parsed.data.imageUrl !== undefined) updateData.order_block_image_url = parsed.data.imageUrl;

    if (existing?.id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("home_reviews")
        .update(updateData)
        .eq("id", existing.id)
        .select("order_block_title, order_block_subtitle1, order_block_text, order_block_image_url")
        .single();
      if (error) {
        console.error("[admin/home-order-block PATCH] Ошибка обновления:", error);
        return NextResponse.json({ error: `Ошибка обновления: ${error.message}` }, { status: 500 });
      }
      revalidateTag("home-order-block");
      return NextResponse.json({
        title: data.order_block_title ?? DEFAULT_ORDER_BLOCK.title,
        subtitle1: data.order_block_subtitle1 ?? DEFAULT_ORDER_BLOCK.subtitle1,
        text: data.order_block_text ?? DEFAULT_ORDER_BLOCK.text,
        imageUrl: data.order_block_image_url ?? null,
      });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("home_reviews")
        .insert({
          rating_count: 50,
          review2_text: "",
          review3_text: "",
          order_block_title: parsed.data.title ?? DEFAULT_ORDER_BLOCK.title,
          order_block_subtitle1: parsed.data.subtitle1 ?? DEFAULT_ORDER_BLOCK.subtitle1,
          order_block_text: parsed.data.text ?? DEFAULT_ORDER_BLOCK.text,
          order_block_image_url: parsed.data.imageUrl ?? null,
          updated_at: new Date().toISOString(),
        })
        .select("order_block_title, order_block_subtitle1, order_block_text, order_block_image_url")
        .single();
      if (error) {
        console.error("[admin/home-order-block PATCH] Ошибка создания:", error);
        return NextResponse.json({ error: `Ошибка создания: ${error.message}` }, { status: 500 });
      }
      revalidateTag("home-order-block");
      return NextResponse.json({
        title: data.order_block_title ?? DEFAULT_ORDER_BLOCK.title,
        subtitle1: data.order_block_subtitle1 ?? DEFAULT_ORDER_BLOCK.subtitle1,
        text: data.order_block_text ?? DEFAULT_ORDER_BLOCK.text,
        imageUrl: data.order_block_image_url ?? null,
      });
    }
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/home-order-block PATCH]", e);
    return NextResponse.json({ error: "Ошибка обновления" }, { status: 500 });
  }
}
