import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs, SECTION_GAP } from "@/components/ui/breadcrumbs";
import { CategoryChips } from "@/components/catalog/category-chips";
import { ProductToolbar } from "@/components/catalog/product-toolbar";
import { FlowerCatalog } from "@/components/catalog/FlowerCatalog";
import { OccasionFilterButtons } from "@/components/catalog/occasion-filter-buttons";
import { Container } from "@/components/layout/Container";
import { getAllCatalogProducts } from "@/lib/products";
import { getCategories, getCategoryBySlug, DEFAULT_CATEGORY_SEO_TEXT } from "@/lib/categories";
import { ALL_CATALOG, CATALOG_PAGE } from "@/lib/catalogCategories";
import { productHasFlowerSlug } from "@/lib/catalogFlowersFromComposition";
import { getFlowersInCompositionList } from "@/lib/getAllFlowers";
import { getOccasionsSubcategories, getProductIdsBySubcategoryIds } from "@/lib/subcategories";
import { OCCASIONS_CATEGORY_SLUG } from "@/lib/constants";
import {
  canonicalUrl,
  truncateDescription,
  ROBOTS_INDEX_FOLLOW,
  SITE_NAME,
  LOCALE,
  CANONICAL_BASE,
  CITY,
} from "@/lib/seo";

type OccasionPageProps = {
  params: Promise<{ occasionSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export const revalidate = 300;

export async function generateStaticParams() {
  const subcategories = await getOccasionsSubcategories();
  return subcategories.filter((sub) => sub.slug && sub.is_active).map((sub) => ({ occasionSlug: sub.slug! }));
}

export async function generateMetadata({ params }: OccasionPageProps): Promise<Metadata> {
  const { occasionSlug } = await params;
  const categories = await getCategories();
  const category = getCategoryBySlug(categories, OCCASIONS_CATEGORY_SLUG);
  if (!category) {
    return { title: "По поводу | The Ame" };
  }

  const subcategories = await getOccasionsSubcategories();
  const occasion = subcategories.find((sub) => sub.slug === occasionSlug && sub.is_active);

  if (!occasion) {
    return { title: "По поводу | The Ame" };
  }

  // SEO title: если указан seo_title → используем его, иначе шаблон
  const title = occasion.seo_title?.trim()
    ? `${occasion.seo_title.trim()} | ${SITE_NAME}`
    : `Купить цветы на ${occasion.name} в ${CITY} с доставкой | ${SITE_NAME}`;

  // SEO description: если указан seo_description → используем его, иначе шаблон
  const description = occasion.seo_description?.trim()
    ? truncateDescription(occasion.seo_description, 160)
    : `Букеты на ${occasion.name.toLowerCase()} в ${CITY}. Свежие цветы с доставкой по городу. Широкий выбор композиций — The Ame.`;

  const url = canonicalUrl(`/magazine/${OCCASIONS_CATEGORY_SLUG}/${occasionSlug}`);
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

export default async function OccasionPage({ params, searchParams }: OccasionPageProps) {
  const { occasionSlug } = await params;
  const resolvedSearchParams = await searchParams;

  // Редирект со старых query-URL
  const occasionParam = resolvedSearchParams.occasion;
  if (occasionParam && typeof occasionParam === "string") {
    const subcategories = await getOccasionsSubcategories();
    const occasion = subcategories.find((sub) => sub.id === occasionParam && sub.slug);
    if (occasion?.slug) {
      permanentRedirect(`/magazine/${OCCASIONS_CATEGORY_SLUG}/${occasion.slug}`);
    }
  }

  const [categories, allProducts, occasionsSubcategories, flowersList] = await Promise.all([
    getCategories(),
    getAllCatalogProducts(),
    getOccasionsSubcategories(),
    getFlowersInCompositionList(),
  ]);

  const category = getCategoryBySlug(categories, OCCASIONS_CATEGORY_SLUG);
  if (!category) {
    notFound();
  }

  // Находим повод по slug
  const occasion = occasionsSubcategories.find((sub) => sub.slug === occasionSlug && sub.is_active);
  if (!occasion) {
    notFound();
  }

  // База — все товары каталога. Фильтр по поводу: только товары, у которых отмечен этот повод (товар или вариант).
  const productIds = await getProductIdsBySubcategoryIds([occasion.id]);
  let products = allProducts.filter((product) => {
    const productIdInDb = product.id.startsWith("vp-") ? product.id.replace("vp-", "") : product.id;
    return productIds.has(product.id) || productIds.has(productIdInDb);
  });

  // Доп. фильтр «Цветы в составе» по query ?flower=slug
  const flowerParam = resolvedSearchParams.flower;
  const flowerFilterSlug =
    flowerParam && typeof flowerParam === "string" ? String(flowerParam).trim() : "";
  if (flowerFilterSlug) {
    products = products.filter((p) => productHasFlowerSlug(p, flowerFilterSlug));
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
    { label: category.name, href: `/magazine/${OCCASIONS_CATEGORY_SLUG}` },
    { label: occasion.name },
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

  // H1 и описание страницы
  const pageTitle = occasion.title?.trim() || occasion.name;
  const pageDescription = occasion.seo_description?.trim() || occasion.description?.trim() || seoText;

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
          <CategoryChips categories={chips} currentSlug={OCCASIONS_CATEGORY_SLUG} />
        </div>

        {occasionsSubcategories.length > 0 && (
          <div className={SECTION_GAP}>
            <OccasionFilterButtons occasions={occasionsSubcategories} />
          </div>
        )}

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
