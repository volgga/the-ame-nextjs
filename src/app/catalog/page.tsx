import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { FlowerCatalog } from "@/components/catalog/FlowerCatalog";
import { getAllCatalogProducts } from "@/lib/products";
import { getCategories } from "@/lib/categories";
import { isValidCategorySlug } from "@/lib/catalogCategories";

export const metadata: Metadata = {
  title: "Каталог букетов",
  description:
    "Каталог The Ame: свежие букеты, монобукеты и композиции в коробках. Розы, гортензии, хризантемы — доставка по Сочи от 45 минут.",
  alternates: {
    canonical: "https://theame.ru/catalog",
  },
};

type CatalogPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const resolved = await searchParams;
  const category = typeof resolved.category === "string" ? resolved.category : undefined;
  const categories = await getCategories();
  const validSlugs = new Set(categories.map((c) => c.slug));
  if (category && isValidCategorySlug(category, validSlugs)) {
    permanentRedirect(`/catalog/${category}`);
  }

  const products = await getAllCatalogProducts();
  return (
    <div className="min-h-screen bg-[#fff8ea]">
      <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-[#7e7e7e]">Загрузка каталога…</div>}>
        <FlowerCatalog products={products} />
      </Suspense>
    </div>
  );
}
