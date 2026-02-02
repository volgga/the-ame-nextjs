import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { isVariantProductId } from "@/lib/variantProducts";

const VP_ID_PREFIX = "vp-";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type QuickViewProduct = {
  id: string;
  name: string;
  price: number;
  image: string;
  images: string[];
  description: string;
  composition: string | null;
  categories: string[];
  isPreorder: boolean;
};

/**
 * GET /api/products/[id]/quick-view
 * Получить полные данные товара для Quick View (images, categories, composition).
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  try {
    // Вариантный товар (vp-123)
    if (isVariantProductId(id)) {
      const numId = id.slice(VP_ID_PREFIX.length);
      const n = parseInt(numId, 10);
      if (Number.isNaN(n)) {
        return NextResponse.json({ error: "Invalid variant product ID" }, { status: 400 });
      }

      // Получаем основной товар
      const { data: vp, error: vpErr } = await supabase
        .from("variant_products")
        .select("id, name, description, image_url, min_price_cache, category_slug, category_slugs, is_preorder")
        .eq("id", n)
        .or("is_active.eq.true,is_active.is.null")
        .or("is_hidden.eq.false,is_hidden.is.null")
        .maybeSingle();

      if (vpErr || !vp) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      // Получаем варианты для изображений
      const { data: variants } = await supabase
        .from("product_variants")
        .select("image_url, composition")
        .eq("product_id", n)
        .eq("is_active", true);

      const images: string[] = [];
      if (vp.image_url) images.push(vp.image_url);
      if (variants) {
        variants.forEach((v) => {
          if (v.image_url && !images.includes(v.image_url)) {
            images.push(v.image_url);
          }
        });
      }

      // Получаем категории (из category_slugs или category_slug)
      const categories: string[] = [];
      const categorySlugs: string[] = [];
      if (vp.category_slugs && Array.isArray(vp.category_slugs)) {
        categorySlugs.push(...vp.category_slugs);
      }
      if (vp.category_slug && !categorySlugs.includes(vp.category_slug)) {
        categorySlugs.push(vp.category_slug);
      }
      if (categorySlugs.length > 0) {
        const { data: cats } = await supabase
          .from("categories")
          .select("name")
          .in("slug", categorySlugs)
          .eq("is_active", true);
        if (cats) {
          categories.push(...cats.map((c) => c.name).filter(Boolean));
        }
      }

      // Состав берем из первого варианта, если есть
      const composition = variants && variants.length > 0 ? variants[0].composition : null;

      return NextResponse.json({
        id,
        name: vp.name ?? "",
        price: Number(vp.min_price_cache) ?? 0,
        image: vp.image_url ?? "",
        images: images.length > 0 ? images : [vp.image_url ?? ""],
        description: vp.description ?? "",
        composition: composition?.trim() || null,
        categories,
        isPreorder: vp.is_preorder ?? false,
      } satisfies QuickViewProduct);
    }

    // Обычный товар (UUID)
    if (UUID_REGEX.test(id)) {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, composition_size, image_url, images, price, category_slug, category_slugs, is_preorder")
        .eq("id", id)
        .or("is_active.eq.true,is_active.is.null")
        .or("is_hidden.eq.false,is_hidden.is.null")
        .maybeSingle();

      if (error || !data) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      const imagesRaw = data.images;
      const images =
        Array.isArray(imagesRaw) && imagesRaw.length > 0
          ? imagesRaw.filter((u): u is string => typeof u === "string" && u.length > 0)
          : [];

      // Если есть основное изображение, добавляем его первым
      const allImages = data.image_url
        ? [data.image_url, ...images.filter((img) => img !== data.image_url)]
        : images;

      // Получаем категории (из category_slugs или category_slug)
      const categories: string[] = [];
      const categorySlugs: string[] = [];
      if (data.category_slugs && Array.isArray(data.category_slugs)) {
        categorySlugs.push(...data.category_slugs);
      }
      if (data.category_slug && !categorySlugs.includes(data.category_slug)) {
        categorySlugs.push(data.category_slug);
      }
      if (categorySlugs.length > 0) {
        const { data: cats } = await supabase
          .from("categories")
          .select("name")
          .in("slug", categorySlugs)
          .eq("is_active", true);
        if (cats) {
          categories.push(...cats.map((c) => c.name).filter(Boolean));
        }
      }

      return NextResponse.json({
        id,
        name: data.name ?? "",
        price: Number(data.price) ?? 0,
        image: data.image_url ?? "",
        images: allImages.length > 0 ? allImages : [data.image_url ?? ""],
        description: data.description ?? "",
        composition: data.composition_size?.trim() || null,
        categories,
        isPreorder: data.is_preorder ?? false,
      } satisfies QuickViewProduct);
    }

    return NextResponse.json({ error: "Invalid product ID format" }, { status: 400 });
  } catch (e) {
    console.error("[quick-view API]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
