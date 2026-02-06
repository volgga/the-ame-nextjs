import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs, SECTION_GAP } from "@/components/ui/breadcrumbs";
import { CategoryChips } from "@/components/catalog/category-chips";
import { ProductToolbar } from "@/components/catalog/product-toolbar";
import { FlowerCatalog } from "@/components/catalog/FlowerCatalog";
import { getAllCatalogProducts } from "@/lib/products";
import { getCategories, getCategoryBySlug, DEFAULT_CATEGORY_SEO_TEXT } from "@/lib/categories";
import { ALL_CATALOG, CATALOG_PAGE, filterProductsByCategorySlug } from "@/lib/catalogCategories";
import {
  canonicalUrl,
  truncateDescription,
  normalizeCategoryNameForTitle,
  ROBOTS_INDEX_FOLLOW,
  ROBOTS_NOINDEX_FOLLOW,
  hasIndexableQueryParams,
  SITE_NAME,
  LOCALE,
  CANONICAL_BASE,
} from "@/lib/seo";

type MagazineCategoryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const VIRTUAL_CATEGORY_SLUGS = ["magazin", "posmotret-vse-tsvety"] as const;


export async function generateStaticParams() {
  const categories = await getCategories();
  return categories
    .filter((c) => !VIRTUAL_CATEGORY_SLUGS.includes(c.slug as (typeof VIRTUAL_CATEGORY_SLUGS)[number]))
    .map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
  searchParams,
}: MagazineCategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const categories = await getCategories();
  const category = getCategoryBySlug(categories, slug);
  if (!category) {
    return { title: "Каталог | The Ame" };
  }

  const normalizedName = normalizeCategoryNameForTitle(category.name);
  // Формула по спеке: "Купить {НазваниеКатегории} в Сочи с доставкой | The Ame"
  // Если в названии уже есть "Сочи" или "доставка" — не дублировать
  const lowerName = normalizedName.toLowerCase();
  const hasSochi = lowerName.includes("сочи");
  const hasDelivery = lowerName.includes("доставка");
  const title = hasSochi || hasDelivery
    ? `${normalizedName} | The Ame`
    : `Купить ${normalizedName} в Сочи с доставкой | The Ame`;

  // Если есть описание категории → использовать его (нормализованное и обрезанное до ≤160 символов)
  // Иначе fallback: "{НазваниеКатегории} с доставкой по Сочи. Свежие цветы и удобный заказ — The Ame."
  const description =
    category.description && category.description.trim().length > 0
      ? truncateDescription(category.description, 160)
      : `${normalizedName} с доставкой по Сочи. Свежие цветы и удобный заказ — The Ame.`;

  const hasParams = hasIndexableQueryParams(resolvedSearchParams);

  const url = canonicalUrl(`/magazine/${slug}`);
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: hasParams ? ROBOTS_NOINDEX_FOLLOW : ROBOTS_INDEX_FOLLOW,
    openGraph: {
      type: "website",
      locale: LOCALE,
      url,
      siteName: SITE_NAME,
      title,
      description,
      images: [{ url: `${CANONICAL_BASE}/IMG_1543.PNG`, width: 900, height: 1200, alt: title }],
    },
  };
}

export default async function MagazineCategoryPage({ params }: MagazineCategoryPageProps) {
  const { slug } = await params;

  if (slug === "magazin") redirect("/magazin");
  if (slug === "posmotret-vse-tsvety") redirect("/posmotret-vse-tsvety");

  const [categories, allProducts] = await Promise.all([getCategories(), getAllCatalogProducts()]);

  const category = getCategoryBySlug(categories, slug);

  // Если категория не найдена или неактивна — 404
  if (!category) {
    notFound();
  }

  const products = filterProductsByCategorySlug(allProducts, slug);
  const seoText = category.description?.trim() || DEFAULT_CATEGORY_SEO_TEXT;

  const priceBounds = (() => {
    const prices = products.map((p) => p.price).filter(Number.isFinite);
    if (!prices.length) return [0, 10000] as [number, number];
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return [min, Math.max(max, min + 1)] as [number, number];
  })();

  const breadcrumbItems = [
    { label: "Главная", href: "/" },
    { label: ALL_CATALOG.title, href: ALL_CATALOG.href },
    { label: category.name },
  ];

  // Фильтруем категории: убираем виртуальные (Все цветы, Каталог) и дубли по slug
  const filteredCategories = categories
    .filter(
      (c) =>
        c.slug !== "posmotret-vse-tsvety" &&
        c.slug !== "magazin" &&
        c.slug.trim() !== "" &&
        c.name !== ALL_CATALOG.title &&
        c.name !== CATALOG_PAGE.title
    )
    .map((c) => ({ slug: c.slug, name: c.name, isAll: false }));

  const uniqueCategories = Array.from(
    new Map(filteredCategories.map((cat) => [cat.slug, cat])).values()
  );

  const chips = [
    { slug: "", name: ALL_CATALOG.title, isAll: true },
    ...uniqueCategories,
  ];

  return (
    <div className="min-h-screen bg-page-bg">
      <div className="container px-4 md:px-8 pt-2 pb-8 md:pt-4 md:pb-10">
        {/* A) Breadcrumb — на мобильной отступ A = заголовок↔описание */}
        <Breadcrumbs items={breadcrumbItems} className="mt-0 mb-2 md:mb-4" />

        {/* B+C) Заголовок + SEO текст; на мобильной компактнее — видно без скролла */}
        <div className={`grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-3 md:gap-8 md:items-start ${SECTION_GAP}`}>
          <h1 className="text-2xl md:text-4xl lg:text-[2.5rem] font-bold text-foreground uppercase tracking-tight">
            {category.name}
          </h1>
          <div className="mt-1 md:mt-0 md:max-h-[120px] md:overflow-y-auto">
            <p className="text-xs md:text-[15px] leading-snug md:leading-relaxed text-foreground/90">{seoText}</p>
          </div>
        </div>

        {/* D) Category chips */}
        <div className={SECTION_GAP}>
          <CategoryChips categories={chips} currentSlug={slug} />
        </div>

        {/* E) Product toolbar */}
        <div className={SECTION_GAP}>
          <Suspense fallback={<div className="h-10" />}>
            <ProductToolbar priceBounds={priceBounds} />
          </Suspense>
        </div>

        {/* Каталог товаров */}
        <Suspense
          fallback={
            <div className="min-h-[60vh] flex items-center justify-center text-[#7e7e7e]">Загрузка каталога…</div>
          }
        >
          <FlowerCatalog products={products} />
        </Suspense>
      </div>
    </div>
  );
}
