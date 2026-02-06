import type { Metadata } from "next";
import { AllFlowersPage } from "@/components/catalog/AllFlowersPage";
import { getCategories, getCategoryBySlug } from "@/lib/categories";
import { ALL_CATALOG } from "@/lib/catalogCategories";
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

const FALLBACK_DESCRIPTION =
  "Все цветы с доставкой по Сочи. Свежие букеты и удобный заказ — The Ame.";

type PosmotretVseTsvetyPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({
  searchParams,
}: PosmotretVseTsvetyPageProps): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const categories = await getCategories();
  const cat = getCategoryBySlug(categories, "posmotret-vse-tsvety");
  const name = cat?.name ?? ALL_CATALOG.title;
  const normalizedName = normalizeCategoryNameForTitle(name);
  // Формула по спеке: "Купить {НазваниеКатегории} в Сочи с доставкой | The Ame"
  const lowerName = normalizedName.toLowerCase();
  const hasSochi = lowerName.includes("сочи");
  const hasDelivery = lowerName.includes("доставка");
  const title = hasSochi || hasDelivery
    ? `${normalizedName} | The Ame`
    : `Купить ${normalizedName} в Сочи с доставкой | The Ame`;
  // Если есть описание категории → использовать его (нормализованное и обрезанное до ≤160 символов)
  // Иначе fallback
  const description =
    cat?.description && cat.description.trim().length > 0
      ? truncateDescription(cat.description, 160)
      : FALLBACK_DESCRIPTION;
  const hasParams = hasIndexableQueryParams(resolvedSearchParams);

  const url = canonicalUrl("/posmotret-vse-tsvety");
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

export default async function PosmotretVseTsvetyPage() {
  const categories = await getCategories();
  const cat = getCategoryBySlug(categories, "posmotret-vse-tsvety");
  const title = cat?.name ?? ALL_CATALOG.title;
  const description = cat?.description?.trim() ?? ALL_CATALOG.description;
  return (
    <AllFlowersPage
      title={title}
      description={description}
      breadcrumbLabel={title}
      showBreadcrumbs={false}
      currentSlug={null}
    />
  );
}
