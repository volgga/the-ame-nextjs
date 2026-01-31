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

const updateSchema = z.object({
  size: z.string().min(1).optional(),
  composition: z.string().optional().nullable(),
  price: z.number().min(0).optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  image_url: z.string().url().optional().nullable(),
  description: z.string().optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    await requireAdmin();
    const { id, variantId } = await params;
    const productId = getVariantProductId(id);
    if (productId === null) {
      return NextResponse.json({ error: "Неверный ID товара" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Неверные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const variantNumId = parseInt(variantId, 10);
    if (Number.isNaN(variantNumId)) {
      return NextResponse.json({ error: "Неверный ID варианта" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("product_variants")
      .update(parsed.data)
      .eq("id", variantNumId)
      .eq("product_id", productId)
      .select()
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Вариант не найден" }, { status: 404 });
    await recalcMinPrice(supabase, productId);
    return NextResponse.json(data);
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/products variants PATCH]", e);
    return NextResponse.json({ error: "Ошибка обновления" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    await requireAdmin();
    const { id, variantId } = await params;
    const productId = getVariantProductId(id);
    if (productId === null) {
      return NextResponse.json({ error: "Неверный ID товара" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const variantNumId = parseInt(variantId, 10);
    if (Number.isNaN(variantNumId)) {
      return NextResponse.json({ error: "Неверный ID варианта" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("product_variants")
      .delete()
      .eq("id", variantNumId)
      .eq("product_id", productId);

    if (error) throw error;
    await recalcMinPrice(supabase, productId);
    return NextResponse.json({ success: true });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/products variants DELETE]", e);
    return NextResponse.json({ error: "Ошибка удаления" }, { status: 500 });
  }
}
