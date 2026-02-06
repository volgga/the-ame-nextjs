import { NextResponse } from "next/server";
import { getAllCatalogProducts } from "@/lib/products";

export const revalidate = 60;

export type SearchProductItem = {
  id: string;
  slug: string;
  title: string;
  price: number;
  image: string;
  shortDescription: string;
  categories?: string[];
};

/**
 * GET /api/products
 * Возвращает все товары каталога для поиска в хедере.
 * Минимальный набор полей: id, slug, title, price, image, shortDescription, categories.
 */
export async function GET() {
  try {
    const products = await getAllCatalogProducts();
    const items: SearchProductItem[] = products.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      price: p.price,
      image: p.image,
      shortDescription: p.shortDescription ?? "",
      categories: p.categories ?? undefined,
    }));
    return NextResponse.json(items);
  } catch (e) {
    console.error("[api/products]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
