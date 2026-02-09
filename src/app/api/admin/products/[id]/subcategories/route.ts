import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";

async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) throw new Error("unauthorized");
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VP_PREFIX = "vp-";

function parseProductId(id: string): { type: "simple"; uuid: string } | { type: "variant"; numId: number } | null {
  if (UUID_REGEX.test(id)) {
    return { type: "simple", uuid: id };
  }
  if (id.startsWith(VP_PREFIX)) {
    const n = parseInt(id.slice(VP_PREFIX.length), 10);
    if (!Number.isNaN(n)) return { type: "variant", numId: n };
  }
  const n = parseInt(id, 10);
  if (!Number.isNaN(n)) return { type: "variant", numId: n };
  return null;
}

/**
 * GET /api/admin/products/[id]/subcategories
 * Возвращает список привязанных подкатегорий для товара
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const parsed = parseProductId(id);
    if (!parsed) {
      return NextResponse.json({ error: "Неверный ID" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("product_subcategories")
      .select("subcategory_id, subcategories(id, name, category_id)")
      .eq("product_id", parsed.type === "simple" ? parsed.uuid : parsed.numId.toString());

    if (error) throw error;
    const subcategories = (data ?? []).map(
      (item: { subcategories: { id: string; name: string; category_id: string } }) => ({
        id: item.subcategories.id,
        name: item.subcategories.name,
        category_id: item.subcategories.category_id,
      })
    );
    return NextResponse.json(subcategories);
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/products subcategories GET]", e);
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }
}

const updateSchema = z.object({
  subcategory_ids: z.array(z.string().uuid()).optional().nullable(),
});

/**
 * PUT /api/admin/products/[id]/subcategories
 * Обновляет привязки товара к подкатегориям
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const parsed = parseProductId(id);
    if (!parsed) {
      return NextResponse.json({ error: "Неверный ID" }, { status: 400 });
    }

    const body = await request.json();
    const result = updateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Неверные данные", details: result.error.flatten() }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const productId = parsed.type === "simple" ? parsed.uuid : parsed.numId.toString();

    // Удаляем все существующие привязки
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("product_subcategories").delete().eq("product_id", productId);

    // Добавляем новые привязки
    if (result.data.subcategory_ids && result.data.subcategory_ids.length > 0) {
      const inserts = result.data.subcategory_ids.map((subcategoryId: string) => ({
        product_id: productId,
        subcategory_id: subcategoryId,
      }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase as any).from("product_subcategories").insert(inserts);
      if (insertError) throw insertError;
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/products subcategories PUT]", e);
    return NextResponse.json({ error: "Ошибка обновления" }, { status: 500 });
  }
}
