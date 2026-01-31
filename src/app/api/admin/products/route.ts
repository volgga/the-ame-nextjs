import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { slugify } from "@/utils/slugify";
import { z } from "zod";

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const [productsRes, variantProductsRes] = await Promise.all([
      sb
        .from("products")
        .select("id, name, slug, price, image_url, is_active, is_hidden, sort_order")
        .order("sort_order", { ascending: true, nullsFirst: false }),
      sb
        .from("variant_products")
        .select("id, name, slug, min_price_cache, image_url, is_active, is_hidden, sort_order")
        .order("sort_order", { ascending: true, nullsFirst: false }),
    ]);

    if (productsRes.error) throw productsRes.error;
    if (variantProductsRes.error) throw variantProductsRes.error;

    const products = (productsRes.data ?? []).map((p: { id: string; name?: string; slug?: string; price?: number; image_url?: string; is_active?: boolean; is_hidden?: boolean; sort_order?: number }) => ({
      id: p.id,
      type: "simple" as const,
      name: p.name,
      slug: p.slug,
      price: Number(p.price ?? 0),
      image_url: p.image_url,
      is_active: p.is_active ?? true,
      is_hidden: p.is_hidden ?? false,
      sort_order: p.sort_order ?? 0,
    }));

    const variantProducts = (variantProductsRes.data ?? []).map((p: { id: number; name?: string; slug?: string; min_price_cache?: number; image_url?: string; is_active?: boolean; is_hidden?: boolean; sort_order?: number }) => ({
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

    let all = [...products, ...variantProducts].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    );

    if (q) {
      const lower = q.toLowerCase();
      all = all.filter(
        (p) =>
          p.name?.toLowerCase().includes(lower) ||
          p.slug?.toLowerCase().includes(lower)
      );
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

const createSimpleSchema = z.object({
  type: z.literal("simple"),
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional(),
  price: z.number().min(0),
  image_url: z.string().url().optional().nullable(),
  images: z.array(z.string()).optional(),
  is_active: z.boolean().default(true),
  is_hidden: z.boolean().default(false),
  sort_order: z.number().int().default(0),
  category_slug: z.string().nullable().optional(),
});

const createVariantSchema = z.object({
  type: z.literal("variant"),
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional(),
  image_url: z.string().url().optional().nullable(),
  is_active: z.boolean().default(true),
  is_hidden: z.boolean().default(false),
  sort_order: z.number().int().default(0),
  category_slug: z.string().nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const type = body?.type;

    const supabase = getSupabaseAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    if (type === "simple") {
      const parsed = createSimpleSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Неверные данные", details: parsed.error.flatten() },
          { status: 400 }
        );
      }
      const slug =
        parsed.data.slug?.trim() || slugify(parsed.data.name) || crypto.randomUUID();
      const { data, error } = await sb
        .from("products")
        .insert({
          name: parsed.data.name,
          slug,
          description: parsed.data.description ?? null,
          price: parsed.data.price,
          image_url: parsed.data.image_url ?? null,
          images: parsed.data.images ?? null,
          is_active: parsed.data.is_active,
          is_hidden: parsed.data.is_hidden,
          sort_order: parsed.data.sort_order,
          category_slug: parsed.data.category_slug ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ ...data, type: "simple" });
    }

    if (type === "variant") {
      const parsed = createVariantSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Неверные данные", details: parsed.error.flatten() },
          { status: 400 }
        );
      }
      const slug =
        parsed.data.slug?.trim() || slugify(parsed.data.name) || String(Date.now());
      const { data, error } = await sb
        .from("variant_products")
        .insert({
          name: parsed.data.name,
          slug,
          description: parsed.data.description ?? null,
          image_url: parsed.data.image_url ?? null,
          min_price_cache: 0,
          is_active: parsed.data.is_active,
          is_hidden: parsed.data.is_hidden,
          sort_order: parsed.data.sort_order,
          category_slug: parsed.data.category_slug ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ ...data, type: "variant", id: `vp-${data.id}` });
    }

    return NextResponse.json({ error: "Укажите type: simple или variant" }, { status: 400 });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/products POST]", e);
    return NextResponse.json({ error: "Ошибка создания" }, { status: 500 });
  }
}
