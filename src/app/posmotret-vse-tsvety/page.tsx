import type { Metadata } from "next";
import { AllFlowersPage } from "@/components/catalog/AllFlowersPage";
import { ALL_CATALOG } from "@/lib/catalogCategories";

export const metadata: Metadata = {
  title: `${ALL_CATALOG.title} | The Ame`,
  description: ALL_CATALOG.description,
  alternates: {
    canonical: "https://theame.ru/posmotret-vse-tsvety",
  },
};

export default async function PosmotretVseTsvetyPage() {
  return (
    <AllFlowersPage
      title={ALL_CATALOG.title}
      description={ALL_CATALOG.description}
      breadcrumbLabel={ALL_CATALOG.title}
    />
  );
}
