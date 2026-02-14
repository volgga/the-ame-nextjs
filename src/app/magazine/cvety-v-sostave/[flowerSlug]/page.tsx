import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
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
import { productHasFlowerSlug } from "@/lib/catalogFlowersFromComposition";
import { getFlowersInCompositionList } from "@/lib/getAllFlowers";
import { getFlowerBySlug, getProductIdsByFlowerId } from "@/lib/flowers";
import { FLOWERS_IN_COMPOSITION_CATEGORY_SLUG } from "@/lib/constants";
import { slugify } from "@/utils/slugify";
import {
  canonicalUrl,
  truncateDescription,
  ROBOTS_INDEX_FOLLOW,
  SITE_NAME,
  LOCALE,
  CANONICAL_BASE,
  CITY,
} from "@/lib/seo";

type FlowerPageProps = {
  params: Promise<{ flowerSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export const revalidate = 300;

export async function generateStaticParams() {
  const list = await getFlowersInCompositionList();
  return list.map((flower) => {
    // Транслитерируем slug в латиницу для статических путей, если содержит кириллицу
    const slug = /[а-яё]/i.test(flower.slug) ? slugify(flower.slug) : flower.slug;
    return { flowerSlug: slug };
  });
}

export async function generateMetadata({ params }: FlowerPageProps): Promise<Metadata> {
  const { flowerSlug } = await params;
  const categories = await getCategories();
  const category = getCategoryBySlug(categories, FLOWERS_IN_COMPOSITION_CATEGORY_SLUG);
  if (!category) {
    return { title: "Цветы в составе | The Ame" };
  }

  const flower = await getFlowerBySlug(flowerSlug);
  const name = flower?.name ?? flowerSlug;
  const title = flower?.seo_title?.trim()
    ? `${flower.seo_title.trim()} | ${SITE_NAME}`
    : `${name} в ${CITY} — купить с доставкой | ${SITE_NAME}`;
  const description = flower?.seo_description?.trim()
    ? truncateDescription(flower.seo_description, 160)
    : `Букеты с ${name.toLowerCase()} в ${CITY}. Свежие цветы с доставкой по городу. Широкий выбор композиций — The Ame.`;

  const url = canonicalUrl(`/magazine/${FLOWERS_IN_COMPOSITION_CATEGORY_SLUG}/${flowerSlug}`);
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: ROBOTS_INDEX_FOLLOW,
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

export default async function FlowerPage({ params, searchParams }: FlowerPageProps) {
  const { flowerSlug } = await params;
  const resolvedSearchParams = await searchParams;

  // Редирект со старых query-URL
  const flowerParam = resolvedSearchParams.flower;
  if (flowerParam && typeof flowerParam === "string") {
    const normalized = normalizeFlowerKey(flowerParam);
    const list = await getFlowersInCompositionList();
    const flowerItem = list.find((f) => normalizeFlowerKey(f.name) === normalized);
    if (flowerItem?.slug) {
      permanentRedirect(`/magazine/${FLOWERS_IN_COMPOSITION_CATEGORY_SLUG}/${flowerItem.slug}`);
    }
  }

  const [categories, allProducts, flowersList, flower] = await Promise.all([
    getCategories(),
    getAllCatalogProducts(),
    getFlowersInCompositionList(),
    getFlowerBySlug(flowerSlug),
  ]);

  const category = getCategoryBySlug(categories, FLOWERS_IN_COMPOSITION_CATEGORY_SLUG);
  if (!category) {
    notFound();
  }

  const flowerItem = flowersList.find((f) => f.slug === flowerSlug);
  if (!flowerItem || !flower) {
    notFound();
  }

  let products = filterProductsByCategorySlug(allProducts, FLOWERS_IN_COMPOSITION_CATEGORY_SLUG);

  // Приоритет: query ?flower= (тулбар), иначе цветок из path
  const flowerFilterSlug =
    flowerParam && typeof flowerParam === "string" ? String(flowerParam).trim() : null;

  if (flowerFilterSlug) {
    products = products.filter((p) => productHasFlowerSlug(p, flowerFilterSlug));
  } else {
    const productIdsWithFlower = await getProductIdsByFlowerId(flower.id);
    if (productIdsWithFlower.size > 0) {
      products = products.filter((p) => productIdsWithFlower.has(p.id));
    } else {
      const flowerFilterKey = normalizeFlowerKey(flower.name);
      products = products.filter((p) => {
        const comp = p.compositionFlowers ?? [];
        return comp.some((f) => normalizeFlowerKey(f) === flowerFilterKey);
      });
    }
  }

  const catalogFlowers = flowersList.map((f) => ({ slug: f.slug, label: f.name }));

  // Пагинация
  const pageParam = resolvedSearchParams.page;
  const currentPage = typeof pageParam === "string" ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;
  const pageSize = 24;
  const total = products.length;
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const paginatedProducts = products.slice(start, end);

  const seoText = category.description?.trim() || DEFAULT_CATEGORY_SEO_TEXT;
  const pageDescription = flower.seo_description?.trim() || flower.description?.trim() || seoText;

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
    { label: category.name, href: `/magazine/${FLOWERS_IN_COMPOSITION_CATEGORY_SLUG}` },
    { label: flower.name },
  ];

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

  const pageTitle = flower.name.toUpperCase();

  return (
    <div className="min-h-screen bg-page-bg">
      <Container className="pt-2 pb-8 md:pt-4 md:pb-10">
        <Breadcrumbs items={breadcrumbItems} className="mt-0 mb-2 md:mb-4" />

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

        <div className={SECTION_GAP}>
          <CategoryChips categories={chips} currentSlug={FLOWERS_IN_COMPOSITION_CATEGORY_SLUG} />
        </div>

        <div className={SECTION_GAP}>
          <FlowerFilterButtons flowers={flowersList} />
        </div>

        <div className={SECTION_GAP}>
          <Suspense fallback={<div className="h-10" />}>
            <ProductToolbar priceBounds={priceBounds} catalogFlowers={catalogFlowers} />
          </Suspense>
        </div>

        <Suspense
          fallback={
            <div className="min-h-[60vh] flex items-center justify-center text-[#7e7e7e]">Загрузка каталога…</div>
          }
        >
          <FlowerCatalog products={paginatedProducts} total={total} currentPage={currentPage} pageSize={pageSize} allProductsForInfiniteScroll={products} />
        </Suspense>
      </Container>
    </div>
  );
}
