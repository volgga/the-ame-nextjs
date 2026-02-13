import type { Metadata } from "next";
import { notFound, redirect, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs, SECTION_GAP } from "@/components/ui/breadcrumbs";
import { CategoryChips } from "@/components/catalog/category-chips";
import { ProductToolbar } from "@/components/catalog/product-toolbar";
import { FlowerCatalog } from "@/components/catalog/FlowerCatalog";
import { FlowerFilterButtons } from "@/components/catalog/flower-filter-buttons";
import { Container } from "@/components/layout/Container";
import { getAllCatalogProducts } from "@/lib/products";
import { getCategories, getCategoryBySlug, DEFAULT_CATEGORY_SEO_TEXT } from "@/lib/categories";
import { ALL_CATALOG, CATALOG_PAGE, filterProductsByCategorySlug } from "@/lib/catalogCategories";
import { normalizeFlowerKey } from "@/lib/normalizeFlowerKey";
import {
  getCatalogFlowersFromProducts,
  productHasFlowerSlug,
} from "@/lib/catalogFlowersFromComposition";
import { getOccasionsSubcategories } from "@/lib/subcategories";
import { OCCASIONS_CATEGORY_SLUG, FLOWERS_IN_COMPOSITION_CATEGORY_SLUG } from "@/lib/constants";
import { OccasionFilterButtons } from "@/components/catalog/occasion-filter-buttons";
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

/** Ревалидация раз в 5 мин — баланс между актуальностью SEO title и нагрузкой (частая ревалидация могла приводить к падению под нагрузкой). */
export const revalidate = 300;

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories
    .filter((c) => !VIRTUAL_CATEGORY_SLUGS.includes(c.slug as (typeof VIRTUAL_CATEGORY_SLUGS)[number]))
    .map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params, searchParams }: MagazineCategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const categories = await getCategories();
  const category = getCategoryBySlug(categories, slug);
  if (!category) {
    return { title: "Каталог | The Ame" };
  }

  // Если заполнен ручной SEO title — используем его, иначе автогенерация
  const normalizedName = normalizeCategoryNameForTitle(category.name);
  const lowerName = normalizedName.toLowerCase();
  const hasSochi = lowerName.includes("сочи");
  const hasDelivery = lowerName.includes("доставка");
  const title = category.seo_title?.trim()
    ? `${category.seo_title.trim()} | The Ame`
    : hasSochi || hasDelivery
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

export default async function MagazineCategoryPage({ params, searchParams }: MagazineCategoryPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const flowerParam = resolvedSearchParams.flower;
  const occasionParam = resolvedSearchParams.occasion;

  if (slug === "magazin") redirect("/magazin");
  if (slug === "posmotret-vse-tsvety") redirect("/posmotret-vse-tsvety");

  const isOccasionsCategory = slug === OCCASIONS_CATEGORY_SLUG;
  const isFlowersInCompositionCategory = slug === FLOWERS_IN_COMPOSITION_CATEGORY_SLUG;

  // Редиректы со старых query-URL на новые slug-URL (?occasion=id или ?occasion=slug)
  if (isOccasionsCategory && occasionParam && typeof occasionParam === "string") {
    const occasionsSubcategories = await getOccasionsSubcategories();
    const occasion =
      occasionsSubcategories.find((sub) => sub.id === occasionParam && sub.slug) ??
      occasionsSubcategories.find((sub) => sub.slug === occasionParam);
    if (occasion?.slug) {
      permanentRedirect(`/magazine/${OCCASIONS_CATEGORY_SLUG}/${occasion.slug}`);
    }
  }

  if (isFlowersInCompositionCategory && flowerParam && typeof flowerParam === "string") {
    const { getFlowersInCompositionList } = await import("@/lib/getAllFlowers");
    const flowersList = await getFlowersInCompositionList();
    const normalized = normalizeFlowerKey(flowerParam);
    const flower = flowersList.find((f) => normalizeFlowerKey(f.name) === normalized);
    if (flower?.slug) {
      permanentRedirect(`/magazine/${FLOWERS_IN_COMPOSITION_CATEGORY_SLUG}/${flower.slug}`);
    }
  }

  const [categories, allProducts, occasionsSubcategories, flowersList] = await Promise.all([
    getCategories(),
    getAllCatalogProducts(),
    isOccasionsCategory ? getOccasionsSubcategories() : Promise.resolve([]),
    isFlowersInCompositionCategory
      ? (await import("@/lib/getAllFlowers")).getFlowersInCompositionList()
      : Promise.resolve([]),
  ]);

  const category = getCategoryBySlug(categories, slug);

  // Если категория не найдена или неактивна — 404
  if (!category) {
    notFound();
  }

  let products = filterProductsByCategorySlug(allProducts, slug);

  // Фильтр «Цветы в составе» из query ?flower=slug (тулбар)
  const flowerFilterSlug =
    flowerParam && typeof flowerParam === "string" ? flowerParam.trim() : "";
  if (flowerFilterSlug) {
    products = products.filter((p) => productHasFlowerSlug(p, flowerFilterSlug));
  }

  const catalogFlowers = getCatalogFlowersFromProducts(allProducts);
  const seoText = category.description?.trim() || DEFAULT_CATEGORY_SEO_TEXT;

  // Пагинация для категорий
  const pageParam = resolvedSearchParams.page;
  const currentPage = typeof pageParam === "string" ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;
  const pageSize = 24;
  const total = products.length;
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const paginatedProducts = products.slice(start, end);

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

  const uniqueCategories = Array.from(new Map(filteredCategories.map((cat) => [cat.slug, cat])).values());

  const chips = [{ slug: "", name: ALL_CATALOG.title, isAll: true }, ...uniqueCategories];

  // Определяем заголовок и описание в зависимости от выбранного цветка
  let pageTitle = category.name;
  let pageDescription = seoText;

  if (isFlowersInCompositionCategory && flowerParam && typeof flowerParam === "string") {
    const flowerKey = normalizeFlowerKey(flowerParam);
    const flowerSection = category.flower_sections?.find((section) => section.key === flowerKey);

    if (flowerSection) {
      // Используем индивидуальные заголовок и описание из админки
      pageTitle = flowerSection.title;
      pageDescription = flowerSection.description || seoText;
    } else {
      // Fallback: используем отображаемое название цветка (capitalize)
      const flowerName = flowerParam
        .split(/[\s\-_]+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
      pageTitle = flowerName;
      pageDescription = `${seoText} Фильтр: ${flowerName}.`;
    }
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Главная",
        item: canonicalUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: ALL_CATALOG.title,
        item: canonicalUrl(ALL_CATALOG.href),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: category.name,
        item: canonicalUrl(`/magazine/${slug}`),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-page-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Container className="pt-2 pb-8 md:pt-4 md:pb-10">
        {/* A) Breadcrumb — на мобильной отступ A = заголовок↔описание */}
        <Breadcrumbs items={breadcrumbItems} className="mt-0 mb-2 md:mb-4" />

        {/* B+C) Заголовок + SEO текст; на мобильной компактнее — видно без скролла */}
        <div className={`grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-3 md:gap-8 md:items-start ${SECTION_GAP}`}>
          <h1 className="text-2xl md:text-4xl lg:text-[2.5rem] font-bold text-foreground uppercase tracking-tight">
            {pageTitle}
          </h1>
          <div className="mt-1 md:mt-0 md:max-h-[120px] md:overflow-y-auto">
            <p className="text-xs md:text-[15px] leading-snug md:leading-relaxed text-foreground/90">
              {pageDescription}
            </p>
          </div>
        </div>

        {/* D) Category chips */}
        <div className={SECTION_GAP}>
          <CategoryChips categories={chips} currentSlug={slug} />
        </div>

        {/* D.5) Flower filter buttons (только для категории "Цветы в составе") — список из товаров */}
        {isFlowersInCompositionCategory && flowersList.length > 0 && (
          <div className={SECTION_GAP}>
            <FlowerFilterButtons flowers={flowersList} />
          </div>
        )}

        {/* D.6) Occasion filter buttons (только для категории "По поводу") */}
        {isOccasionsCategory && occasionsSubcategories.length > 0 && (
          <div className={SECTION_GAP}>
            <OccasionFilterButtons occasions={occasionsSubcategories} />
          </div>
        )}

        {/* E) Product toolbar */}
        <div className={SECTION_GAP}>
          <Suspense fallback={<div className="h-10" />}>
            <ProductToolbar priceBounds={priceBounds} catalogFlowers={catalogFlowers} />
          </Suspense>
        </div>

        {/* Каталог товаров */}
        <Suspense
          fallback={
            <div className="min-h-[60vh] flex items-center justify-center text-[#7e7e7e]">Загрузка каталога…</div>
          }
        >
          <FlowerCatalog products={paginatedProducts} total={total} currentPage={currentPage} pageSize={pageSize} />
        </Suspense>
      </Container>
    </div>
  );
}
