import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";
import { getVariantProductId, recalcMinPrice } from "../../../utils";

async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) throw new Error("unauthorized");
}

/** Извлечь человекочитаемое сообщение об ошибке (включая Supabase details/hint) */
function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "object" && e !== null) {
    const obj = e as Record<string, unknown>;
    if (typeof obj.message === "string") {
      let msg = obj.message;
      if (typeof obj.hint === "string" && obj.hint) msg += ` (${obj.hint})`;
      if (typeof obj.details === "string" && obj.details) msg += ` — ${obj.details}`;
      return msg;
    }
  }
  return "Ошибка обновления";
}

const optionalImageUrl = z
  .union([z.string(), z.null(), z.literal("")])
  .optional()
  .transform((v) => (v === "" ? null : v));

const updateSchema = z.object({
  size: z.string().min(1).optional(),
  composition: z.string().optional().nullable(),
  height_cm: z.number().int().min(0).optional().nullable(),
  width_cm: z.number().int().min(0).optional().nullable(),
  price: z.number().min(0).optional(),
  is_preorder: z.boolean().optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  image_url: optionalImageUrl, // Обратная совместимость - игнорируется на клиенте
  description: z.string().optional().nullable(),
  seo_title: z.string().max(300).optional().nullable(), // Обратная совместимость - игнорируется на клиенте
  seo_description: z.string().max(500).optional().nullable(), // Обратная совместимость - игнорируется на клиенте
  og_image: z
    .string()
    .max(2000)
    .optional()
    .nullable()
    .transform((v) => (v === "" ? null : v)), // Обратная совместимость - игнорируется на клиенте
  bouquet_colors: z.array(z.string()).optional().nullable(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; variantId: string }> }) {
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
      const flatten = parsed.error.flatten();
      console.error("[admin/products variants PATCH] validation failed:", flatten);
      return NextResponse.json(
        { error: "Неверные данные", details: flatten, fieldErrors: flatten.fieldErrors },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const variantNumId = parseInt(variantId, 10);
    if (Number.isNaN(variantNumId)) {
      return NextResponse.json({ error: "Неверный ID варианта" }, { status: 400 });
    }

    // В БД колонка названия варианта — title. API принимает size; маппим в title для update.
    const { size, bouquet_colors, ...rest } = parsed.data;
    const dbUpdate: Record<string, unknown> = size !== undefined ? { ...rest, title: size } : { ...rest };
    if (bouquet_colors !== undefined) {
      dbUpdate.bouquet_colors =
        Array.isArray(bouquet_colors) && bouquet_colors.length > 0
          ? bouquet_colors.filter((k) => typeof k === "string" && k.length > 0)
          : null;
    }

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
    revalidateTag("catalog-products", "max");
    const row = data as { title?: string; size?: string; name?: string };
    return NextResponse.json({
      ...data,
      name: row.title ?? row.name ?? row.size ?? "",
      size: row.title ?? row.size ?? "",
    });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    const errMsg = getErrorMessage(e);
    console.error("[admin/products variants PATCH]", e);
    return NextResponse.json({ error: errMsg }, { status: 500 });
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
    revalidateTag("catalog-products", "max");
    return NextResponse.json({ success: true });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/products variants DELETE]", e);
    return NextResponse.json({ error: "Ошибка удаления" }, { status: 500 });
  }
}
