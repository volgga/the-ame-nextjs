import { createClient } from "@supabase/supabase-js";
import { OCCASIONS_CATEGORY_SLUG, FLOWERS_IN_COMPOSITION_CATEGORY_SLUG } from "./constants";

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
      .select("id, category_id, name, slug, title, description, seo_title, seo_description, sort_order, is_active")
      .eq("category_id", categories.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true, nullsFirst: false });

    if (subError) {
      console.error("[getOccasionsSubcategories] Error loading subcategories:", subError);
      return [];
    }

    return (subcategories || []) as Subcategory[];
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
 * Получить все подкатегории категории "Цветы в составе" (цветы)
 */
export async function getFlowersInCompositionSubcategories(): Promise<Subcategory[]> {
  try {
    // Сначала находим категорию "Цветы в составе"
    const { data: categories, error: catError } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", FLOWERS_IN_COMPOSITION_CATEGORY_SLUG)
      .eq("is_active", true)
      .maybeSingle();

    if (catError || !categories) {
      console.error("[getFlowersInCompositionSubcategories] Category not found:", catError);
      return [];
    }

    // Загружаем подкатегории этой категории
    const { data: subcategories, error: subError } = await supabase
      .from("subcategories")
      .select("id, category_id, name, slug, title, description, seo_title, seo_description, sort_order, is_active")
      .eq("category_id", categories.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true, nullsFirst: false });

    if (subError) {
      console.error("[getFlowersInCompositionSubcategories] Error loading subcategories:", subError);
      return [];
    }

    return (subcategories || []) as Subcategory[];
  } catch (e) {
    console.error("[getFlowersInCompositionSubcategories] Exception:", e);
    return [];
  }
}

/**
 * Получить подкатегорию по slug и category_id
 */
export async function getSubcategoryBySlug(categoryId: string, slug: string): Promise<Subcategory | null> {
  try {
    const { data, error } = await supabase
      .from("subcategories")
      .select("id, category_id, name, slug, title, description, seo_title, seo_description, sort_order, is_active")
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
