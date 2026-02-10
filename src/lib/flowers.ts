/**
 * Справочник "Цветы в составе" (таблица flowers).
 * Единый источник для админки, модалки товара и витрины.
 * Список можно автосинхронизировать из товаров; SEO/порядок редактируются вручную.
 */

import { supabase } from "@/lib/supabaseClient";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getAllCatalogProducts } from "@/lib/products";
import { extractUniqueFlowers } from "@/lib/extractFlowersFromProduct";
import { normalizeFlowerKey } from "@/lib/normalizeFlowerKey";

export type Flower = {
  id: string;
  slug: string;
  name: string;
  title?: string | null;
  description?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  is_active: boolean;
  sort_order: number;
  created_at?: string | null;
  updated_at?: string | null;
};

/** Нормализация отображаемого имени (Title Case) */
function toTitleCase(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => (word.length ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word))
    .join(" ");
}

/**
 * Все записи из таблицы flowers (для админки — все, для витрины — только активные).
 */
export async function getFlowers(activeOnly = false): Promise<Flower[]> {
  try {
    let query = supabase
      .from("flowers")
      .select("id, slug, name, title, description, seo_title, seo_description, is_active, sort_order, created_at, updated_at")
      .order("sort_order", { ascending: true, nullsFirst: false });

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;
    if (error) {
      console.error("[getFlowers]", error);
      return [];
    }
    return (data ?? []) as Flower[];
  } catch (e) {
    console.error("[getFlowers]", e);
    return [];
  }
}

/**
 * Один цветок по slug.
 */
export async function getFlowerBySlug(slug: string): Promise<Flower | null> {
  try {
    const normalized = normalizeFlowerKey(slug);
    const { data, error } = await supabase
      .from("flowers")
      .select("id, slug, name, title, description, seo_title, seo_description, is_active, sort_order, created_at, updated_at")
      .eq("slug", normalized)
      .eq("is_active", true)
      .maybeSingle();
    if (error || !data) return null;
    return data as Flower;
  } catch (e) {
    console.error("[getFlowerBySlug]", e);
    return null;
  }
}

/**
 * Сырой список уникальных названий цветов из всех товаров каталога (канон: Title Case, нормализованный slug).
 */
async function getRawFlowerNamesFromProducts(): Promise<{ name: string; slug: string }[]> {
  const products = await getAllCatalogProducts();
  const names = extractUniqueFlowers(products);
  return names.map((name) => ({
    name: toTitleCase(name),
    slug: normalizeFlowerKey(name),
  }));
}

/**
 * Синхронизация справочника flowers из товаров.
 * - Для каждого имени из товаров: ищем Flower по slug или по name (normalized).
 * - Если нет — создаём (is_active=true, sort_order в конец, title/description/seo пустые).
 * - Если есть — НЕ затираем title/description/seo_title/seo_description; при необходимости обновляем только name (осторожно).
 * Удаление не выполняется: если цветок пропал из товаров, не удаляем, только можно пометить is_active=false вручную.
 */
export async function syncFlowersFromProducts(): Promise<{ created: number; updated: number }> {
  const sb = getSupabaseAdmin();
  const raw = await getRawFlowerNamesFromProducts();
  let created = 0;
  let updated = 0;

  const { data: existing } = await sb
    .from("flowers")
    .select("id, slug, name, sort_order");
  const bySlug = new Map<string, { id: string; name: string; sort_order: number }>();
  (existing ?? []).forEach((row: { id: string; slug: string; name: string; sort_order: number }) => {
    bySlug.set(row.slug.toLowerCase().trim(), row);
    bySlug.set(row.name.toLowerCase().trim(), row);
  });

  const maxOrder = existing?.length
    ? Math.max(...(existing as { sort_order: number }[]).map((r) => r.sort_order ?? 0), -1)
    : -1;
  let nextOrder = maxOrder + 1;

  for (const { name, slug } of raw) {
    if (!slug || !name.trim()) continue;
    const key = slug.toLowerCase();
    const existingRow = bySlug.get(key) ?? bySlug.get(name.toLowerCase().trim());

    if (!existingRow) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (sb as any).from("flowers").insert({
    slug,
    name: name.trim(),
    title: null,
    description: null,
    seo_title: null,
    seo_description: null,
    is_active: true,
    sort_order: nextOrder++,
  });
      if (!error) {
        created++;
        bySlug.set(key, { id: "", name, sort_order: nextOrder - 1 });
      }
    } else {
      if (existingRow.name !== name.trim()) {
        const { error } = await sb
          .from("flowers")
          .update({ name: name.trim(), updated_at: new Date().toISOString() })
          .eq("id", existingRow.id);
        if (!error) updated++;
      }
    }
  }

  return { created, updated };
}

/**
 * Удалить цветок из справочника (и связи в product_flowers по CASCADE).
 */
export async function deleteFlower(id: string): Promise<boolean> {
  try {
    const sb = getSupabaseAdmin();
    const { error } = await sb.from("flowers").delete().eq("id", id);
    return !error;
  } catch (e) {
    console.error("[deleteFlower]", e);
    return false;
  }
}

/**
 * Обновление одной записи flower (SEO, название, активность, порядок).
 */
export async function updateFlower(
  id: string,
  patch: Partial<Pick<Flower, "name" | "slug" | "title" | "description" | "seo_title" | "seo_description" | "is_active" | "sort_order">>
): Promise<Flower | null> {
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from("flowers")
      .update({
        ...(patch.name != null && { name: patch.name.trim() }),
        ...(patch.slug != null && { slug: normalizeFlowerKey(patch.slug) || patch.slug }),
        ...(patch.title != null && { title: patch.title.trim() || null }),
        ...(patch.description != null && { description: patch.description.trim() || null }),
        ...(patch.seo_title != null && { seo_title: patch.seo_title.trim() || null }),
        ...(patch.seo_description != null && { seo_description: patch.seo_description.trim() || null }),
        ...(patch.is_active != null && { is_active: patch.is_active }),
        ...(patch.sort_order != null && { sort_order: patch.sort_order }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) return null;
    return data as Flower;
  } catch (e) {
    console.error("[updateFlower]", e);
    return null;
  }
}

/**
 * Обновление порядка цветов (массив id в нужном порядке).
 */
export async function reorderFlowers(orderedIds: string[]): Promise<boolean> {
  try {
    const sb = getSupabaseAdmin();
    await Promise.all(
      orderedIds.map((id, i) =>
        sb.from("flowers").update({ sort_order: i, updated_at: new Date().toISOString() }).eq("id", id)
      )
    );
    return true;
  } catch (e) {
    console.error("[reorderFlowers]", e);
    return false;
  }
}

/**
 * Убедиться, что цветы с указанными именами есть в справочнике; вернуть их (для получения id при сохранении товара).
 */
export async function ensureFlowers(names: string[]): Promise<Flower[]> {
  if (names.length === 0) return [];
  const sb = getSupabaseAdmin();
  const result: Flower[] = [];
  const seen = new Set<string>();

  for (const rawName of names) {
    const name = toTitleCase(rawName);
    const slug = normalizeFlowerKey(name);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);

    const { data: existing } = await sb.from("flowers").select("id, slug, name, title, description, seo_title, seo_description, is_active, sort_order").eq("slug", slug).maybeSingle();
    if (existing) {
      result.push(existing as Flower);
      continue;
    }
    const { data: maxOrder } = await sb.from("flowers").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
    const nextOrder = (maxOrder as { sort_order: number } | null)?.sort_order != null ? (maxOrder as { sort_order: number }).sort_order + 1 : 0;
    const { data: inserted, error } = await sb.from("flowers").insert({ slug, name, is_active: true, sort_order: nextOrder }).select().single();
    if (!error && inserted) result.push(inserted as Flower);
  }
  return result;
}

/** product_id в БД: для simple = uuid, для variant = id варианта как строка (как в product_subcategories). */
function toProductIdForDb(productId: string): string {
  const vpPrefix = "vp-";
  if (productId.startsWith(vpPrefix)) {
    return productId.slice(vpPrefix.length);
  }
  return productId;
}

/**
 * Получить ID цветов, привязанных к товару (product_flowers).
 */
export async function getProductFlowerIds(productId: string): Promise<string[]> {
  const pid = toProductIdForDb(productId);
  const { data } = await supabase.from("product_flowers").select("flower_id").eq("product_id", pid);
  return (data ?? []).map((r: { flower_id: string }) => r.flower_id);
}

/**
 * Установить привязки товара к цветам (product_flowers) и обновить composition_flowers в products/variant_products.
 */
export async function setProductFlowers(productId: string, flowerIds: string[], flowerNames: string[]): Promise<boolean> {
  const sb = getSupabaseAdmin();
  const pid = toProductIdForDb(productId);
  const isVariant = productId.startsWith("vp-");

  await sb.from("product_flowers").delete().eq("product_id", pid);
  if (flowerIds.length > 0) {
    const rows = flowerIds.map((flower_id) => ({ product_id: pid, flower_id }));
    const { error } = await sb.from("product_flowers").insert(rows);
    if (error) return false;
  }

  const table = isVariant ? "variant_products" : "products";
  const rowId = isVariant ? parseInt(pid, 10) : productId;
  const { error } = await (sb as any).from(table).update({ composition_flowers: flowerNames.length > 0 ? flowerNames : null }).eq("id", rowId);
  return !error;
}

/**
 * Список цветов для витрины: активные, по порядку (чипы фильтра, страницы по цветку).
 */
export async function getFlowersForCatalog(): Promise<Flower[]> {
  return getFlowers(true);
}

/**
 * ID товаров каталога, у которых есть данный цвет (по product_flowers).
 * product_id в БД: uuid для products, число как строка для variant_products.
 */
export async function getProductIdsByFlowerId(flowerId: string): Promise<Set<string>> {
  const { data } = await supabase.from("product_flowers").select("product_id").eq("flower_id", flowerId);
  if (!data || data.length === 0) return new Set();
  const result = new Set<string>();
  const { data: productIds } = await supabase.from("products").select("id");
  const productSet = new Set((productIds ?? []).map((x: { id: string }) => x.id));
  const { data: variantRows } = await supabase.from("variant_products").select("id");
  const variantIdSet = new Set((variantRows ?? []).map((x: { id: number }) => String(x.id)));
  for (const row of data as { product_id: string }[]) {
    const pid = row.product_id;
    if (productSet.has(pid)) result.add(pid);
    else if (variantIdSet.has(pid)) result.add("vp-" + pid);
    else result.add(pid);
  }
  return result;
}
