import type { Metadata } from "next";
import { getCatalogProductBySlug, getAllCatalogProducts } from "@/lib/products";
import { getProductDetails } from "@/lib/productDetails";
import { getAddOnCategoriesOrder, buildAddToOrderProducts } from "@/lib/addOnProducts";
import { notFound } from "next/navigation";
import { ProductPageClient } from "@/components/product/ProductPageClient";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const products = await getAllCatalogProducts();
  return products.map((product) => ({
    slug: product.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getCatalogProductBySlug(slug);

  if (!product) {
    return {
      title: "Товар не найден",
    };
  }

  return {
    title: `${product.title} — купить с доставкой за 45 минут по Сочи | The Ame`,
    description: `Свежий букет ${product.title} с бесплатной доставкой по Сочи за 45 минут. ${product.shortDescription}`,
    alternates: {
      canonical: `https://theame.ru/product/${slug}`,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [product, productDetails, addOnCategoryOrder, allCatalogProducts] = await Promise.all([
    getCatalogProductBySlug(slug),
    getProductDetails(),
    getAddOnCategoriesOrder(),
    getAllCatalogProducts(),
  ]);

  if (!product) {
    notFound();
  }

  const addToOrderProducts = buildAddToOrderProducts(
    allCatalogProducts,
    addOnCategoryOrder,
    product.id
  );

  return (
    <ProductPageClient
      product={product}
      productDetails={productDetails}
      addToOrderProducts={addToOrderProducts}
    />
  );
}
