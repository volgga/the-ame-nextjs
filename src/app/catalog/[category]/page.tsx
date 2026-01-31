import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FlowerCatalog } from "@/components/catalog/FlowerCatalog";
import { getAllCatalogProducts } from "@/lib/products";
import { getCategories } from "@/lib/categories";
import { getCategoryBySlug } from "@/lib/categories";
import {
  isValidCategorySlug,
  filterProductsByCategorySlug,
} from "@/lib/catalogCategories";

type CategoryPageProps = {
  params: Promise<{ category: string }>;
};

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const categories = await getCategories();
  const category = getCategoryBySlug(categories, categorySlug);
  if (!category) {
    return { title: "Каталог | The Ame" };
  }
  return {
    title: `${category.name} | The Ame`,
    description: `Каталог The Ame: ${category.name}. Доставка по Сочи от 45 минут.`,
    alternates: {
      canonical: `https://theame.ru/catalog/${categorySlug}`,
    },
  };
}

export default async function CatalogCategoryPage({ params }: CategoryPageProps) {
  const { category: categorySlug } = await params;

  const [categories, allProducts] = await Promise.all([
    getCategories(),
    getAllCatalogProducts(),
  ]);

  const validSlugs = new Set(categories.map((c) => c.slug));
  if (!isValidCategorySlug(categorySlug, validSlugs)) {
    notFound();
  }

  const category = getCategoryBySlug(categories, categorySlug);
  if (!category) {
    notFound();
  }

  const products = filterProductsByCategorySlug(allProducts, categorySlug);

  return (
    <div className="min-h-screen bg-[#fff8ea]">
      <Suspense
        fallback={
          <div className="min-h-[60vh] flex items-center justify-center text-[#7e7e7e]">
            Загрузка каталога…
          </div>
        }
      >
        <FlowerCatalog products={products} categoryTitle={category.name} />
      </Suspense>
    </div>
  );
}
