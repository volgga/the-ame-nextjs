import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";

const VP_PREFIX = "vp-";

async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) throw new Error("unauthorized");
}

function getVariantProductId(id: string): number | null {
  if (id.startsWith(VP_PREFIX)) {
    const n = parseInt(id.slice(VP_PREFIX.length), 10);
    return Number.isNaN(n) ? null : n;
  }
  const n = parseInt(id, 10);
  return Number.isNaN(n) ? null : n;
}

const variantSchema = z.object({
  size: z.string().min(1),
  composition: z.string().optional().nullable(),
  price: z.number().min(0),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
  image_url: z.string().url().optional().nullable(),
  description: z.string().optional().nullable(),
});

/** Добавить вариант и пересчитать min_price_cache */
async function recalcMinPrice(supabase: ReturnType<typeof import("@/lib/supabaseAdmin")["getSupabaseAdmin"]>, productId: number) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const { data } = await sb
    .from("product_variants")
    .select("price")
    .eq("product_id", productId)
    .eq("is_active", true);
  const prices = (data ?? []).map((r: { price?: number }) => Number(r.price ?? 0)).filter((p: number) => p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  await sb
    .from("variant_products")
    .update({ min_price_cache: minPrice })
    .eq("id", productId);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const productId = getVariantProductId(id);
    if (productId === null) {
      return NextResponse.json({ error: "Неверный ID товара" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = variantSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Неверные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("product_variants")
      .insert({
        product_id: productId,
        size: parsed.data.size,
        composition: parsed.data.composition ?? null,
        price: parsed.data.price,
        is_active: parsed.data.is_active,
        sort_order: parsed.data.sort_order,
        image_url: parsed.data.image_url ?? null,
        description: parsed.data.description ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    await recalcMinPrice(supabase, productId);
    return NextResponse.json(data);
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/products variants POST]", e);
    return NextResponse.json({ error: "Ошибка создания варианта" }, { status: 500 });
  }
}
