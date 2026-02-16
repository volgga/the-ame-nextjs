import { createClient } from "@supabase/supabase-js";
import { OCCASIONS_CATEGORY_SLUG } from "./constants";
import { slugify } from "@/utils/slugify";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  slug?: string | null;
  title?: string | null;
  description?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  sort_order?: number | null;
  is_active?: boolean | null;
  /** Информационный блок внизу страницы подкатегории */
  info_subtitle?: string | null;
  info_description?: string | null;
  info_content?: string | null;
  info_image_url?: string | null;
}

/**
 * Получить все подкатегории категории "По поводу" (поводы)
 */
export async function getOccasionsSubcategories(): Promise<Subcategory[]> {
  try {
    // Сначала находим категорию "По поводу"
    const { data: categories, error: catError } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", OCCASIONS_CATEGORY_SLUG)
      .eq("is_active", true)
      .maybeSingle();

    if (catError || !categories) {
      console.error("[getOccasionsSubcategories] Category not found:", catError);
      return [];
    }

    // Загружаем подкатегории этой категории
    const { data: subcategories, error: subError } = await supabase
      .from("subcategories")
      .select("id, category_id, name, slug, title, description, seo_title, seo_description, sort_order, is_active, info_subtitle, info_description, info_content, info_image_url")
      .eq("category_id", categories.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true, nullsFirst: false });

    if (subError) {
      console.error("[getOccasionsSubcategories] Error loading subcategories:", subError);
      return [];
    }

    const list = (subcategories || []) as Subcategory[];
    // Fallback slug из name для подкатегорий без slug (миграция могла не заполнять slug)
    const withSlug = list.map((sub) => ({
      ...sub,
      slug: (sub.slug && String(sub.slug).trim()) || slugify(sub.name) || null,
    }));
    // Порядок: sort_order, затем по названию
    withSlug.sort((a, b) => {
      const oa = a.sort_order ?? 999;
      const ob = b.sort_order ?? 999;
      if (oa !== ob) return oa - ob;
      return (a.name || "").localeCompare(b.name || "");
    });
    return withSlug;
  } catch (e) {
    console.error("[getOccasionsSubcategories] Exception:", e);
    return [];
  }
}

/**
 * Получить ID товаров, связанных с подкатегориями (поводами)
 */
export async function getProductIdsBySubcategoryIds(subcategoryIds: string[]): Promise<Set<string>> {
  if (subcategoryIds.length === 0) return new Set();

  try {
    const { data, error } = await supabase
      .from("product_subcategories")
      .select("product_id")
      .in("subcategory_id", subcategoryIds);

    if (error) {
      console.error("[getProductIdsBySubcategoryIds] Error:", error);
      return new Set();
    }

    return new Set((data || []).map((row) => String(row.product_id)));
  } catch (e) {
    console.error("[getProductIdsBySubcategoryIds] Exception:", e);
    return new Set();
  }
}

/**
 * Получить подкатегорию по slug и category_id
 */
export async function getSubcategoryBySlug(categoryId: string, slug: string): Promise<Subcategory | null> {
  try {
    const { data, error } = await supabase
      .from("subcategories")
      .select("id, category_id, name, slug, title, description, seo_title, seo_description, sort_order, is_active, info_subtitle, info_description, info_content, info_image_url")
      .eq("category_id", categoryId)
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data) {
      console.error("[getSubcategoryBySlug] Error:", error);
      return null;
    }

    return data as Subcategory;
  } catch (e) {
    console.error("[getSubcategoryBySlug] Exception:", e);
    return null;
  }
}
