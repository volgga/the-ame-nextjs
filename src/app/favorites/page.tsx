import type { Metadata } from "next";
import { getAllCatalogProducts } from "@/lib/products";
import { FavoritesPageClient } from "./FavoritesPageClient";
import { canonicalUrl, ROBOTS_INDEX_FOLLOW } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Избранное | The Ame",
  description: "Избранные товары The Áme — букеты и композиции.",
  alternates: { canonical: canonicalUrl("/favorites") },
  robots: ROBOTS_INDEX_FOLLOW,
};

export default async function FavoritesPage() {
  const products = await getAllCatalogProducts();
  return <FavoritesPageClient products={products} />;
}
