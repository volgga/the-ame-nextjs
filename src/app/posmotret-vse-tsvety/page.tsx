import type { Metadata } from "next";
import { AllFlowersPage } from "@/components/catalog/AllFlowersPage";
import { getCategories, getCategoryBySlug } from "@/lib/categories";
import { ALL_CATALOG } from "@/lib/catalogCategories";

export async function generateMetadata(): Promise<Metadata> {
  const categories = await getCategories();
  const cat = getCategoryBySlug(categories, "posmotret-vse-tsvety");
  const title = cat?.name ?? ALL_CATALOG.title;
  const description = cat?.description?.trim() ?? ALL_CATALOG.description;
  return {
    title: `${title} | The Ame`,
    description,
    alternates: {
      canonical: "https://theame.ru/posmotret-vse-tsvety",
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
