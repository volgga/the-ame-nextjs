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
 * GET /api/admin/products/[id]/occasions
 * Возвращает список привязанных "По поводу" для товара
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
      .from("product_occasions")
      .select("occasion_id, occasions(id, name)")
      .eq("product_id", parsed.type === "simple" ? parsed.uuid : parsed.numId.toString());

    if (error) throw error;
    const occasions = (data ?? []).map((item: { occasions: { id: string; name: string } }) => ({
      id: item.occasions.id,
      name: item.occasions.name,
    }));
    return NextResponse.json(occasions);
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/products occasions GET]", e);
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }
}

const updateSchema = z.object({
  occasion_ids: z.array(z.string().uuid()).optional().nullable(),
});

/**
 * PUT /api/admin/products/[id]/occasions
 * Обновляет привязки товара к "По поводу"
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
    await (supabase as any).from("product_occasions").delete().eq("product_id", productId);

    // Добавляем новые привязки
    if (result.data.occasion_ids && result.data.occasion_ids.length > 0) {
      const inserts = result.data.occasion_ids.map((occasionId: string) => ({
        product_id: productId,
        occasion_id: occasionId,
      }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase as any).from("product_occasions").insert(inserts);
      if (insertError) throw insertError;
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/products occasions PUT]", e);
    return NextResponse.json({ error: "Ошибка обновления" }, { status: 500 });
  }
}
