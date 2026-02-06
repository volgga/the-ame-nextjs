import type { Metadata } from "next";
import { getAllCatalogProducts } from "@/lib/products";
import { FavoritesPageClient } from "./FavoritesPageClient";

export const metadata: Metadata = {
  title: "Избранное | The Ame",
  description: "Избранные товары The Áme — букеты и композиции.",
  alternates: { canonical: "https://theame.ru/favorites" },
};

export default async function FavoritesPage() {
  const products = await getAllCatalogProducts();
  return <FavoritesPageClient products={products} />;
}
