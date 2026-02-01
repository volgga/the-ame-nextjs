import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";
import { getVariantProductId, recalcMinPrice } from "../../../utils";

async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) throw new Error("unauthorized");
}

const updateSchema = z.object({
  size: z.string().min(1).optional(),
  composition: z.string().optional().nullable(),
  height_cm: z.number().int().min(0).optional().nullable(),
  width_cm: z.number().int().min(0).optional().nullable(),
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

    // В БД колонка названия варианта — title. API принимает size; маппим в title для update.
    const { size, ...rest } = parsed.data;
    const dbUpdate = size !== undefined ? { ...rest, title: size } : rest;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("product_variants")
      .update(dbUpdate)
      .eq("id", variantNumId)
      .eq("product_id", productId)
      .select()
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Вариант не найден" }, { status: 404 });
    await recalcMinPrice(supabase, productId);
    const row = data as { title?: string; size?: string; name?: string };
    return NextResponse.json({ ...data, name: row.title ?? row.name ?? row.size ?? "", size: row.title ?? row.size ?? "" });
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
