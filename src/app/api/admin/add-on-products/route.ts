import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getAddOnCategoriesOrder } from "@/lib/addOnProducts";
import { z } from "zod";

async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) throw new Error("unauthorized");
}

/** GET: текущий порядок категорий для блока «Хотите добавить к заказу?» */
export async function GET() {
  try {
    await requireAdmin();
    const categorySlugs = await getAddOnCategoriesOrder();
    return NextResponse.json({ categorySlugs });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/add-on-products GET]", e);
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }
}

const patchSchema = z.object({
  categorySlugs: z.array(z.string().min(1)).min(0),
});

/** PATCH: сохранить порядок категорий (полная замена списка). Slug только из таблицы categories. */
export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Неверные данные", details: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const slugOrder = parsed.data.categorySlugs;

    if (slugOrder.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: categoryRows, error: catError } = await (supabase as any).from("categories").select("slug");
      if (catError) {
        return NextResponse.json({ error: "Ошибка загрузки категорий" }, { status: 500 });
      }
      const validSlugs = new Set(
        (categoryRows ?? []).map((r: { slug: string }) => String(r.slug ?? "").trim()).filter(Boolean)
      );
      const invalid = slugOrder.filter((s) => !validSlugs.has(s));
      if (invalid.length > 0) {
        return NextResponse.json(
          { error: "Недопустимые slug категорий (должны существовать в таблице categories)", invalid },
          { status: 400 }
        );
      }
    }

    // Удаляем все строки и вставляем новый порядок
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase as any)
      .from("add_on_products_categories")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (deleteError) {
      if (deleteError.code === "42P01") {
        return NextResponse.json(
          {
            error:
              "Таблица add_on_products_categories не создана. Выполните миграцию scripts/migrations/add-on-products-categories.sql",
          },
          { status: 500 }
        );
      }
      console.error("[admin/add-on-products PATCH] delete:", deleteError);
      return NextResponse.json({ error: "Ошибка обновления" }, { status: 500 });
    }

    if (slugOrder.length > 0) {
      const rows = slugOrder.map((category_slug, i) => ({ category_slug, sort_order: i }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase as any).from("add_on_products_categories").insert(rows);

      if (insertError) {
        console.error("[admin/add-on-products PATCH] insert:", insertError);
        return NextResponse.json({ error: "Ошибка сохранения порядка" }, { status: 500 });
      }
    }

    const categorySlugs = await getAddOnCategoriesOrder();
    revalidateTag("add-on-products");
    return NextResponse.json({ categorySlugs });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/add-on-products PATCH]", e);
    return NextResponse.json({ error: "Ошибка обновления" }, { status: 500 });
  }
}
