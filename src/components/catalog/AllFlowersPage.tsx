import { Suspense } from "react";
import { Breadcrumbs, SECTION_GAP } from "@/components/ui/breadcrumbs";
import { CategoryChips } from "@/components/catalog/category-chips";
import { ProductToolbar } from "@/components/catalog/product-toolbar";
import { FlowerCatalog } from "@/components/catalog/FlowerCatalog";
import { Container } from "@/components/layout/Container";
import { getAllCatalogProducts, getCatalogProductsPaginated } from "@/lib/products";
import { getCategories } from "@/lib/categories";
import { ALL_CATALOG, CATALOG_PAGE } from "@/lib/catalogCategories";
import {
  getCatalogFlowersFromProducts,
  productHasFlowerSlug,
} from "@/lib/catalogFlowersFromComposition";

export type AllFlowersPageProps = {
  /** Заголовок страницы (H1) */
  title: string;
  /** SEO/описательный текст под заголовком */
  description: string;
  /** Текст в хлебных крошках для этой страницы (если showBreadcrumbs true) */
  breadcrumbLabel: string;
  /** Показывать хлебные крошки. По умолчанию true. Для страницы "Все цветы" — false */
  showBreadcrumbs?: boolean;
  /** Текущий роут для подсветки чипа: null = активен "Все цветы", "magazin" = ни один не активен, иначе slug категории */
  currentSlug?: string | null;
  /** Параметры поиска из URL (для пагинации) */
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * Общая разметка и логика страницы «все товары каталога».
 * Используется для /posmotret-vse-tsvety (Все цветы) и /magazin (Каталог).
 */
export async function AllFlowersPage({
  title,
  description,
  breadcrumbLabel,
  showBreadcrumbs = true,
  currentSlug = null,
  searchParams,
}: AllFlowersPageProps) {
  // Читаем параметры из URL
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const pageParam = resolvedSearchParams.page;
  const flowerParam = resolvedSearchParams.flower;
  const currentPage = typeof pageParam === "string" ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;
  const pageSize = 24;
  const flowerFilterSlug =
    flowerParam && typeof flowerParam === "string" ? String(flowerParam).trim() : "";

  // Для /magazin используем singlePage режим (все товары, автодогрузка)
  const isSinglePage = currentSlug === "magazin";

  const allProducts = await getAllCatalogProducts();

  // Фильтр «Цветы в составе» по query ?flower=slug
  let baseProducts = allProducts;
  if (flowerFilterSlug) {
    baseProducts = allProducts.filter((p) => productHasFlowerSlug(p, flowerFilterSlug));
  }

  const catalogFlowers = getCatalogFlowersFromProducts(allProducts);

  // Загружаем категории; для пагинации (не magazin) считаем от baseProducts
  const [categories, catalogData] = await Promise.all([
    getCategories(),
    isSinglePage ? Promise.resolve(null) : Promise.resolve({
      items: baseProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize),
      total: baseProducts.length,
    }),
  ]);

  const products = isSinglePage ? baseProducts : (catalogData?.items ?? []);
  const total = isSinglePage ? baseProducts.length : (catalogData?.total ?? 0);
  const priceBounds = (() => {
    const prices = baseProducts.map((p) => p.price).filter(Number.isFinite);
    if (!prices.length) return [0, 10000] as [number, number];
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return [min, Math.max(max, min + 1)] as [number, number];
  })();

  const breadcrumbItems = [{ label: "Главная", href: "/" }, { label: breadcrumbLabel }];

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

  return (
    <div className="min-h-screen bg-page-bg">
      <Container className="pt-2 pb-8 md:pt-4 md:pb-10">
        {showBreadcrumbs && <Breadcrumbs items={breadcrumbItems} className="mt-0 mb-2 md:mb-4" />}

        <div className={`grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-3 md:gap-8 md:items-start ${SECTION_GAP}`}>
          <h1 className="text-2xl md:text-4xl lg:text-[2.5rem] font-bold text-color-text-main uppercase tracking-tight">
            {title}
          </h1>
          <div className="mt-1 md:mt-0 md:max-h-[120px] md:overflow-y-auto">
            <p className="text-xs md:text-[15px] leading-snug md:leading-relaxed text-color-text-secondary">
              {description}
            </p>
          </div>
        </div>

        <div className={SECTION_GAP}>
          <CategoryChips categories={chips} currentSlug={currentSlug ?? null} />
        </div>

        <div className={SECTION_GAP}>
          <Suspense fallback={<div className="h-10" />}>
            <ProductToolbar priceBounds={priceBounds} catalogFlowers={catalogFlowers} />
          </Suspense>
        </div>

        <Suspense
          fallback={
            <div className="min-h-[60vh] flex items-center justify-center text-color-text-secondary">
              Загрузка каталога…
            </div>
          }
        >
          <FlowerCatalog 
            products={products} 
            total={total} 
            currentPage={currentPage} 
            pageSize={pageSize}
            singlePage={isSinglePage}
          />
        </Suspense>
      </Container>
    </div>
  );
}
