import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CategoryChips } from "@/components/catalog/category-chips";
import { ProductToolbar } from "@/components/catalog/product-toolbar";
import { FlowerCatalog } from "@/components/catalog/FlowerCatalog";
import { getAllCatalogProducts } from "@/lib/products";
import {
  getCategories,
  getCategoryBySlug,
  DEFAULT_CATEGORY_SEO_TEXT,
} from "@/lib/categories";
import { ALL_CATALOG, filterProductsByCategorySlug } from "@/lib/catalogCategories";

type MagazineCategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: MagazineCategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getCategories();
  const category = getCategoryBySlug(categories, slug);
  if (!category) {
    return { title: "Каталог | The Ame" };
  }
  return {
    title: `${category.name} | The Ame`,
    description: `Каталог The Ame: ${category.name}. Доставка цветов по Сочи от 45 минут.`,
    alternates: {
      canonical: `https://theame.ru/magazine/${slug}`,
    },
  };
}

export default async function MagazineCategoryPage({ params }: MagazineCategoryPageProps) {
  const { slug } = await params;

  const [categories, allProducts] = await Promise.all([
    getCategories(),
    getAllCatalogProducts(),
  ]);

  const category = getCategoryBySlug(categories, slug);

  // Если категория не найдена или неактивна — 404
  if (!category) {
    notFound();
  }

  const products = filterProductsByCategorySlug(allProducts, slug);
  const seoText = (category.description?.trim()) || DEFAULT_CATEGORY_SEO_TEXT;

  const priceBounds = (() => {
    const prices = products.map((p) => p.price).filter(Number.isFinite);
    if (!prices.length) return [0, 10000] as [number, number];
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return [min, Math.max(max, min + 1)] as [number, number];
  })();

  const breadcrumbItems = [
    { label: "Главная", href: "/" },
    { label: "Каталог", href: ALL_CATALOG.href },
    { label: category.name },
  ];

  const chips = [
    { slug: "", name: ALL_CATALOG.title, isAll: true },
    ...categories.map((c) => ({ slug: c.slug, name: c.name, isAll: false })),
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="container px-6 pt-8 pb-4 md:pt-10 md:pb-6">
        {/* A) Breadcrumb — всегда сверху, не зависит от высоты описания */}
        <div className="mb-6 md:mb-8">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        {/* B+C) Заголовок + SEO текст — описание по верху H1 (как flowerna) */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-6 md:gap-8 md:items-start mb-8 md:mb-10">
          <h1 className="text-2xl md:text-4xl lg:text-[2.5rem] font-bold text-foreground uppercase tracking-tight">
            {category.name}
          </h1>
          <div className="max-h-[96px] md:max-h-[120px] overflow-y-auto mt-3 md:mt-0">
            <p className="text-base md:text-[15px] leading-relaxed text-foreground/90">
              {seoText}
            </p>
          </div>
        </div>

        {/* D) Category chips */}
        <div className="mb-8 md:mb-10">
          <CategoryChips categories={chips} currentSlug={slug} />
        </div>

        {/* E) Product toolbar */}
        <div className="mb-6 md:mb-8">
          <Suspense fallback={<div className="h-10" />}>
            <ProductToolbar priceBounds={priceBounds} />
          </Suspense>
        </div>
      </div>

      {/* Каталог товаров */}
      <Suspense
        fallback={
          <div className="min-h-[60vh] flex items-center justify-center text-[#7e7e7e]">
            Загрузка каталога…
          </div>
        }
      >
        <FlowerCatalog products={products} />
      </Suspense>
    </div>
  );
}
