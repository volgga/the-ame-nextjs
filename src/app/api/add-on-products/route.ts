import { NextResponse } from "next/server";
import { getAddOnCategoriesOrder } from "@/lib/addOnProducts";
import { getCategories } from "@/lib/categories";
import { getAllCatalogProducts } from "@/lib/products";
import type { Product } from "@/lib/products";

export const revalidate = 60;

/** Элемент товара для блока «Добавить к заказу» в корзине */
export type AddOnProductItem = {
  id: string;
  slug: string;
  title: string;
  price: number;
  image: string;
};

/** Группа доп.товаров по категории (порядок категорий из админки) */
export type AddOnGroup = {
  categorySlug: string;
  categoryName: string;
  products: AddOnProductItem[];
};

export type AddOnProductsResponse = {
  groups: AddOnGroup[];
};

function norm(s: string | null | undefined): string {
  return String(s ?? "")
    .trim()
    .toLowerCase();
}

function productMatchesCategory(p: Product, categorySlug: string): boolean {
  const want = norm(categorySlug);
  if (!want) return false;
  if (norm(p.categorySlug) === want) return true;
  if (p.categorySlugs?.some((s) => norm(s) === want)) return true;
  return false;
}

function filterByCategorySlug(products: Product[], categorySlug: string): Product[] {
  return products.filter((p) => productMatchesCategory(p, categorySlug));
}

/**
 * GET /api/add-on-products
 * Публичный эндпоинт: категории доп.товаров в порядке из админки (add_on_products_categories.sort_order)
 * и товары по каждой категории. Fallback: если порядок пуст — категории из товаров по name ASC.
 */
export async function GET() {
  try {
    const [categorySlugOrder, categories, allProducts] = await Promise.all([
      getAddOnCategoriesOrder(),
      getCategories(),
      getAllCatalogProducts(),
    ]);

    const slugToName = new Map(categories.map((c) => [c.slug.trim(), c.name]));

    let slugOrder = categorySlugOrder.map((s) => s.trim()).filter(Boolean);

    if (slugOrder.length === 0 && allProducts.length > 0) {
      const usedSlugs = new Set<string>();
      for (const p of allProducts) {
        if (p.categorySlug && p.categorySlug.trim()) usedSlugs.add(p.categorySlug.trim().toLowerCase());
        p.categorySlugs?.forEach((s) => s?.trim() && usedSlugs.add(s.trim().toLowerCase()));
      }
      const fromCategories = categories
        .filter((c) => usedSlugs.has(c.slug.trim().toLowerCase()))
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      slugOrder = fromCategories.map((c) => c.slug.trim());
    }

    const groups: AddOnGroup[] = [];

    for (const slug of slugOrder) {
      const categoryName = slugToName.get(slug) ?? slug;
      const products = filterByCategorySlug(allProducts, slug);
      if (products.length === 0) continue;

      const items: AddOnProductItem[] = products.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        price: p.price,
        image: p.image ?? "",
      }));

      groups.push({ categorySlug: slug, categoryName, products: items });
    }

    return NextResponse.json({ groups } satisfies AddOnProductsResponse);
  } catch (e) {
    console.error("[api/add-on-products]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
