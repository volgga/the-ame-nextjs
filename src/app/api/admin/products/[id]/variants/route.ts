import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";
import { getVariantProductId, recalcMinPrice } from "../../utils";

async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) throw new Error("unauthorized");
}

const optionalImageUrl = z
  .union([z.string(), z.null(), z.literal("")])
  .optional()
  .transform((v) => (v === "" ? null : v));

const variantSchema = z.object({
  size: z.string().min(1),
  composition: z.string().optional().nullable(),
  height_cm: z.number().int().min(0).optional().nullable(),
  width_cm: z.number().int().min(0).optional().nullable(),
  price: z.number().min(0),
  is_preorder: z.boolean().default(false),
  is_new: z.boolean().default(false),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
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
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      const flatten = parsed.error.flatten();
      console.error("[admin/products variants POST] validation failed:", flatten);
      return NextResponse.json(
        { error: "Неверные данные", details: flatten, fieldErrors: flatten.fieldErrors },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    // В БД колонка названия варианта — title (не size). API принимает size для совместимости с формой.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("product_variants")
      .insert({
        product_id: productId,
        title: parsed.data.size,
        composition: parsed.data.composition ?? null,
        height_cm: parsed.data.height_cm ?? null,
        width_cm: parsed.data.width_cm ?? null,
        price: parsed.data.price,
        is_preorder: parsed.data.is_preorder,
        is_new: parsed.data.is_new ?? false,
        is_active: parsed.data.is_active,
        sort_order: parsed.data.sort_order,
        image_url: parsed.data.image_url ?? null, // Обратная совместимость
        description: parsed.data.description ?? null,
        seo_title: parsed.data.seo_title?.trim() || null, // Обратная совместимость
        seo_description: parsed.data.seo_description?.trim() || null, // Обратная совместимость
        og_image: parsed.data.og_image?.trim() || null, // Обратная совместимость
      })
      .select()
      .single();

    if (error) throw error;
    await recalcMinPrice(supabase, productId);
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
    console.error("[admin/products variants POST]", e);
    return NextResponse.json({ error: "Ошибка создания варианта" }, { status: 500 });
  }
}
