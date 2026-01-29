import type { Metadata } from "next";
import { getProductBySlug, getAllProducts } from "@/lib/products";
import { notFound } from "next/navigation";
import Image from "next/image";
import { ProductPageClient } from "@/components/product/ProductPageClient";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const products = getAllProducts();
  return products.map((product) => ({
    slug: product.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

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
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return <ProductPageClient product={product} />;
}
