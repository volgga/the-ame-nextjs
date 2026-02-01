import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { slugify } from "@/utils/slugify";
import { z } from "zod";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VP_PREFIX = "vp-";

async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) throw new Error("unauthorized");
}

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

const updateSimpleSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
  composition_size: z.string().optional().nullable(),
  height_cm: z.number().int().min(0).optional().nullable(),
  width_cm: z.number().int().min(0).optional().nullable(),
  price: z.number().min(0).optional(),
  image_url: z.string().url().optional().nullable(),
  images: z.array(z.string()).optional().nullable(),
  is_active: z.boolean().optional(),
  is_hidden: z.boolean().optional(),
  is_preorder: z.boolean().optional(),
  category_slug: z.string().nullable().optional(),
});

const updateVariantSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
  composition: z.string().optional().nullable(),
  height_cm: z.number().int().min(0).optional().nullable(),
  width_cm: z.number().int().min(0).optional().nullable(),
  image_url: z.string().url().optional().nullable(),
  is_active: z.boolean().optional(),
  is_hidden: z.boolean().optional(),
  category_slug: z.string().nullable().optional(),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const parsed = parseProductId(id);
    if (!parsed) {
      return NextResponse.json({ error: "Неверный ID" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    if (parsed.type === "simple") {
      const { data, error } = await supabase.from("products").select("*").eq("id", parsed.uuid).maybeSingle();
      if (error) throw error;
      if (!data) return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
      return NextResponse.json({ ...(data as object), type: "simple" });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: vp, error: vpErr } = await (supabase as any)
      .from("variant_products")
      .select("*")
      .eq("id", parsed.numId)
      .maybeSingle();
    if (vpErr) throw vpErr;
    if (!vp) return NextResponse.json({ error: "Товар не найден" }, { status: 404 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: variants, error: vErr } = await (supabase as any)
      .from("product_variants")
      .select("*")
      .eq("product_id", parsed.numId)
      .order("sort_order", { ascending: true, nullsFirst: false });

    if (vErr) throw vErr;

    const variantsNorm = (variants ?? []).map((v: { title?: string; size?: string; name?: string }) => ({
      ...v,
      name: v.title ?? v.size ?? v.name ?? "",
    }));

    return NextResponse.json({
      ...(vp as object),
      type: "variant",
      id: `vp-${(vp as { id: number }).id}`,
      variants: variantsNorm,
    });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/products GET id]", e);
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const parsed = parseProductId(id);
    if (!parsed) {
      return NextResponse.json({ error: "Неверный ID" }, { status: 400 });
    }

    const body = await request.json();
    const supabase = getSupabaseAdmin();

    if (parsed.type === "simple") {
      const result = updateSimpleSchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json({ error: "Неверные данные", details: result.error.flatten() }, { status: 400 });
      }
      const updates: Record<string, unknown> = { ...result.data };
      if (result.data.name && !result.data.slug) {
        updates.slug = slugify(result.data.name);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("products")
        .update(updates)
        .eq("id", parsed.uuid)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json(data);
    }

    const result = updateVariantSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Неверные данные", details: result.error.flatten() }, { status: 400 });
    }
    const updates: Record<string, unknown> = { ...result.data };
    if (result.data.name && !result.data.slug) {
      updates.slug = slugify(result.data.name);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("variant_products")
      .update(updates)
      .eq("id", parsed.numId)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ ...data, id: `vp-${data.id}` });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/products PATCH]", e);
    return NextResponse.json({ error: "Ошибка обновления" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const parsed = parseProductId(id);
    if (!parsed) {
      return NextResponse.json({ error: "Неверный ID" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    if (parsed.type === "simple") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("products").delete().eq("id", parsed.uuid);
      if (error) throw error;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("variant_products").delete().eq("id", parsed.numId);
      if (error) throw error;
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/products DELETE]", e);
    return NextResponse.json({ error: "Ошибка удаления" }, { status: 500 });
  }
}
