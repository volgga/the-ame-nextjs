/**
 * Категории каталога. Загрузка из Supabase (таблица categories).
 * Fallback на статический список, если таблица пуста или отсутствует.
 */

import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/supabaseClient";

export type Category = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  /** SEO/описательный текст категории. Если нет — показывается DEFAULT_CATEGORY_SEO_TEXT. */
  description?: string | null;
  /** Ручной SEO заголовок (title). Если заполнен — используется в <title> вместо автогенерации. */
  seo_title?: string | null;
};

/** Дефолтный SEO-текст, если у категории нет своего seoText. */
export const DEFAULT_CATEGORY_SEO_TEXT =
  "The Ame — это сервис, которому можно доверить не только букет. Мы с удовольствием выполним ваше поручение: заберём подарок, заедем за любимым тортом или доставим композицию анонимно. Всё — с безупречным стилем и вниманием к деталям.";

const FALLBACK_CATEGORIES: Category[] = [
  { id: "1", name: "Авторские букеты", slug: "avtorskie-bukety", sort_order: 0, is_active: true },
  { id: "2", name: "Моно букеты", slug: "mono-bukety", sort_order: 1, is_active: true },
  { id: "3", name: "Композиции в коробке", slug: "kompozicii-v-korobke", sort_order: 2, is_active: true },
  { id: "4", name: "Вазы", slug: "vazy", sort_order: 3, is_active: true },
];

async function getCategoriesUncached(): Promise<Category[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return FALLBACK_CATEGORIES;

  try {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, sort_order, is_active, description, seo_title")
      .eq("is_active", true)
      .order("sort_order", { ascending: true, nullsFirst: false });

    if (error || !data?.length) return FALLBACK_CATEGORIES;

    return data.map((r) => ({
      id: String(r.id),
      name: r.name ?? "",
      slug: r.slug ?? "",
      sort_order: r.sort_order ?? 0,
      is_active: r.is_active ?? true,
      description: r.description ?? null,
      seo_title: r.seo_title ?? null,
    }));
  } catch {
    return FALLBACK_CATEGORIES;
  }
}

/** Кэш 5 мин — категории редко меняются */
export async function getCategories(): Promise<Category[]> {
  return unstable_cache(getCategoriesUncached, ["categories"], { revalidate: 300 })();
}

export function getCategoryBySlug(categories: Category[], slug: string): Category | null {
  return categories.find((c) => c.slug === slug) ?? null;
}
