import type { Metadata } from "next";
import { AllFlowersPage } from "@/components/catalog/AllFlowersPage";
import { getCategories, getCategoryBySlug } from "@/lib/categories";
import { ALL_CATALOG } from "@/lib/catalogCategories";
import {
  canonicalUrl,
  trimDescription,
  normalizeCategoryNameForTitle,
  ROBOTS_INDEX_FOLLOW,
  ROBOTS_NOINDEX_FOLLOW,
  hasIndexableQueryParams,
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
  const title =
    normalizedName.toLowerCase().includes("сочи") || normalizedName.toLowerCase().includes("доставка")
      ? `${normalizedName} | The Ame`
      : `Купить ${normalizedName} в Сочи с доставкой | The Ame`;
  const descRaw = cat?.description?.trim() ?? ALL_CATALOG.description;
  const description = trimDescription(descRaw, 160) || FALLBACK_DESCRIPTION;
  const hasParams = hasIndexableQueryParams(resolvedSearchParams);

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl("/posmotret-vse-tsvety") },
    robots: hasParams ? ROBOTS_NOINDEX_FOLLOW : ROBOTS_INDEX_FOLLOW,
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
