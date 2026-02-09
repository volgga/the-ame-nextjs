import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { slugify } from "@/utils/slugify";
import { z } from "zod";
import type { ProductRow, VariantProductRow } from "@/types/admin";

/** Извлечь текст ошибки из Supabase или Error (включая hint/details) */
function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "object" && e !== null) {
    const obj = e as Record<string, unknown>;
    // Supabase возвращает { message, code, details, hint }
    if (typeof obj.message === "string") {
      let msg = obj.message;
      if (typeof obj.hint === "string" && obj.hint) {
        msg += ` (${obj.hint})`;
      }
      if (typeof obj.details === "string" && obj.details) {
        msg += ` — ${obj.details}`;
      }
      return msg;
    }
  }
  return "Ошибка создания";
}

async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) throw new Error("unauthorized");
}

/** Список всех товаров: products + variant_products с поиском */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = request.nextUrl;
    const q = searchParams.get("q")?.trim() || "";

    const supabase = getSupabaseAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- типы Supabase .from() не совпадают с нашей схемой
    const sb = supabase as any;
    const [productsRes, variantProductsRes] = await Promise.all([
      sb
        .from("products")
        .select("id, name, slug, price, image_url, is_active, is_hidden, is_preorder, is_new, new_until, sort_order")
        .order("sort_order", { ascending: true, nullsFirst: false }),
      sb
        .from("variant_products")
        .select("id, name, slug, min_price_cache, image_url, is_active, is_hidden, sort_order")
        .order("sort_order", { ascending: true, nullsFirst: false }),
    ]);

    if (productsRes.error) throw productsRes.error;
    if (variantProductsRes.error) throw variantProductsRes.error;

    const products = (productsRes.data ?? []).map((p: ProductRow) => ({
      id: p.id,
      type: "simple" as const,
      name: p.name,
      slug: p.slug,
      price: Number(p.price ?? 0),
      image_url: p.image_url,
      is_active: p.is_active ?? true,
      is_hidden: p.is_hidden ?? false,
      is_preorder: p.is_preorder ?? false,
      sort_order: p.sort_order ?? 0,
    }));

    const variantProducts = (variantProductsRes.data ?? []).map((p: VariantProductRow) => ({
      id: `vp-${p.id}`,
      type: "variant" as const,
      name: p.name,
      slug: p.slug,
      price: Number(p.min_price_cache ?? 0),
      image_url: p.image_url,
      is_active: p.is_active ?? true,
      is_hidden: p.is_hidden ?? false,
      sort_order: p.sort_order ?? 0,
    }));

    let all = [...products, ...variantProducts].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    if (q) {
      const lower = q.toLowerCase();
      all = all.filter((p) => p.name?.toLowerCase().includes(lower) || p.slug?.toLowerCase().includes(lower));
    }

    return NextResponse.json(all);
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/products GET]", e);
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }
}

const optionalImageUrl = z.union([z.string(), z.null(), z.literal("")]).optional().transform((v) => (v === "" ? null : v));

const createSimpleSchema = z.object({
  type: z.literal("simple"),
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional(),
  composition_size: z.string().optional().nullable(),
  height_cm: z.number().int().min(0).optional().nullable(),
  width_cm: z.number().int().min(0).optional().nullable(),
  price: z.number().min(0),
  image_url: optionalImageUrl,
  images: z.array(z.string()).optional(),
  is_active: z.boolean().default(true),
  is_hidden: z.boolean().default(false),
  is_preorder: z.boolean().default(false),
  is_new: z.boolean().default(false),
  new_until: z.string().datetime().nullable().optional(),
  category_slug: z.string().nullable().optional(),
  category_slugs: z.array(z.string()).optional().nullable(),
  seo_title: z.string().max(300).optional().nullable(),
  seo_description: z.string().max(500).optional().nullable(),
  seo_keywords: z.string().max(500).optional().nullable(),
  og_title: z.string().max(300).optional().nullable(),
  og_description: z.string().max(500).optional().nullable(),
  og_image: z.string().max(2000).optional().nullable().transform((v) => (v === "" ? null : v)),
});

const createVariantSchema = z.object({
  type: z.literal("variant"),
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional(),
  image_url: optionalImageUrl,
  is_active: z.boolean().default(true),
  is_hidden: z.boolean().default(false),
  category_slug: z.string().nullable().optional(),
  category_slugs: z.array(z.string()).optional().nullable(),
  seo_title: z.string().max(300).optional().nullable(),
  seo_description: z.string().max(500).optional().nullable(),
  seo_keywords: z.string().max(500).optional().nullable(),
  og_title: z.string().max(300).optional().nullable(),
  og_description: z.string().max(500).optional().nullable(),
  og_image: z.string().max(2000).optional().nullable().transform((v) => (v === "" ? null : v)),
  variants: z
    .array(
      z.object({
        name: z.string().min(1),
        composition: z.string().optional().nullable(),
        height_cm: z.number().int().min(0).optional().nullable(),
        width_cm: z.number().int().min(0).optional().nullable(),
        price: z.number().min(0),
        is_preorder: z.boolean().default(false),
        image_url: optionalImageUrl,
        sort_order: z.number().default(0),
        is_active: z.boolean().default(true),
        seo_title: z.string().max(300).optional().nullable(),
        seo_description: z.string().max(500).optional().nullable(),
        og_image: z.string().max(2000).optional().nullable().transform((v) => (v === "" ? null : v)),
      })
    )
    .min(1),
});

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const type = body?.type;

    const supabase = getSupabaseAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- типы Supabase .from() не совпадают с нашей схемой
    const sb = supabase as any;

    if (type === "simple") {
      const parsed = createSimpleSchema.safeParse(body);
      if (!parsed.success) {
        const flatten = parsed.error.flatten();
        const payload = {
          error: "Неверные данные",
          details: flatten,
          fieldErrors: flatten.fieldErrors as Record<string, string[]>,
        };
        console.error("[admin/products POST] validation failed (simple):", payload);
        return NextResponse.json(payload, { status: 400 });
      }
      const slug = parsed.data.slug?.trim() || slugify(parsed.data.name) || crypto.randomUUID();
      const categorySlugs = parsed.data.category_slugs?.filter(Boolean) ?? null;
      const mainCategorySlug = categorySlugs?.[0] ?? parsed.data.category_slug ?? null;
      
      // Логика для is_new и new_until:
      // Если is_new = true и new_until не задан -> установить now() + 30 days
      // Если is_new = false -> new_until = null
      let newUntil: string | null = parsed.data.new_until ?? null;
      if (parsed.data.is_new && !newUntil) {
        const now = new Date();
        now.setDate(now.getDate() + 30);
        newUntil = now.toISOString();
      } else if (!parsed.data.is_new) {
        newUntil = null;
      }
      
      const { data, error } = await sb
        .from("products")
        .insert({
          name: parsed.data.name,
          slug,
          description: parsed.data.description ?? null,
          composition_size: parsed.data.composition_size ?? null,
          height_cm: parsed.data.height_cm ?? null,
          width_cm: parsed.data.width_cm ?? null,
          price: parsed.data.price,
          image_url: parsed.data.image_url ?? null,
          images: parsed.data.images ?? null,
          is_active: parsed.data.is_active,
          is_hidden: parsed.data.is_hidden,
          is_preorder: parsed.data.is_preorder,
          is_new: parsed.data.is_new,
          new_until: newUntil,
          sort_order: 0,
          category_slug: mainCategorySlug,
          category_slugs: categorySlugs,
          seo_title: parsed.data.seo_title?.trim() || null,
          seo_description: parsed.data.seo_description?.trim() || null,
          seo_keywords: parsed.data.seo_keywords?.trim() || null,
          og_title: parsed.data.og_title?.trim() || null,
          og_description: parsed.data.og_description?.trim() || null,
          og_image: parsed.data.og_image?.trim() || null,
        })
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ ...data, type: "simple" });
    }

    if (type === "variant") {
      const parsed = createVariantSchema.safeParse(body);
      if (!parsed.success) {
        const flatten = parsed.error.flatten();
        const payload = {
          error: "Неверные данные",
          details: flatten,
          fieldErrors: flatten.fieldErrors as Record<string, string[]>,
        };
        console.error("[admin/products POST] validation failed (variant):", payload);
        return NextResponse.json(payload, { status: 400 });
      }
      const slug = parsed.data.slug?.trim() || slugify(parsed.data.name) || String(Date.now());

      const categorySlugs = parsed.data.category_slugs?.filter(Boolean) ?? null;
      const mainCategorySlug = categorySlugs?.[0] ?? parsed.data.category_slug ?? null;

      // Вычислить min_price_cache из вариантов (минимальная цена среди активных вариантов, не-предзаказов)
      const variantsWithPrice = parsed.data.variants.filter((v) => !v.is_preorder && v.price > 0);
      const minPrice = variantsWithPrice.length > 0 ? Math.min(...variantsWithPrice.map((v) => v.price)) : 0;

      // Создать variant_product
      const { data: vpData, error: vpError } = await sb
        .from("variant_products")
        .insert({
          name: parsed.data.name,
          slug,
          description: parsed.data.description ?? null,
          image_url: parsed.data.image_url ?? null,
          min_price_cache: minPrice,
          is_active: parsed.data.is_active,
          is_hidden: parsed.data.is_hidden,
          sort_order: 0,
          category_slug: mainCategorySlug,
          category_slugs: categorySlugs,
          seo_title: parsed.data.seo_title?.trim() || null,
          seo_description: parsed.data.seo_description?.trim() || null,
          seo_keywords: parsed.data.seo_keywords?.trim() || null,
          og_title: parsed.data.og_title?.trim() || null,
          og_description: parsed.data.og_description?.trim() || null,
          og_image: parsed.data.og_image?.trim() || null,
        })
        .select()
        .single();

      if (vpError) throw vpError;

      // Создать product_variants
      // В БД колонка называется "title", не "name"
      const variantsToInsert = parsed.data.variants.map((v) => ({
        product_id: vpData.id,
        title: v.name,
        composition: v.composition ?? null,
        height_cm: v.height_cm ?? null,
        width_cm: v.width_cm ?? null,
        price: v.price,
        is_preorder: v.is_preorder,
        image_url: v.image_url ?? null,
        sort_order: v.sort_order,
        is_active: v.is_active,
        seo_title: v.seo_title?.trim() || null,
        seo_description: v.seo_description?.trim() || null,
        og_image: v.og_image?.trim() || null,
      }));

      const { error: variantsError } = await sb.from("product_variants").insert(variantsToInsert);

      if (variantsError) throw variantsError;

      return NextResponse.json({ ...vpData, type: "variant", id: `vp-${vpData.id}` });
    }

    const payload = { error: "Укажите type: simple или variant", details: { receivedType: type } };
    console.error("[admin/products POST] missing or invalid type:", payload);
    return NextResponse.json(payload, { status: 400 });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    const errMsg = getErrorMessage(e);
    console.error("[admin/products POST]", e);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
