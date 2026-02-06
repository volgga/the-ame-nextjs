import type { Metadata } from "next";
import { getCatalogProductBySlug, getAllCatalogProducts } from "@/lib/products";
import { getProductDetails } from "@/lib/productDetails";
import { getAddOnCategoriesOrder, buildAddToOrderProducts } from "@/lib/addOnProducts";
import { notFound } from "next/navigation";
import { ProductPageClient } from "@/components/product/ProductPageClient";
import { canonicalUrl, trimDescription, ROBOTS_INDEX_FOLLOW, CANONICAL_BASE } from "@/lib/seo";

type Props = {
  params: Promise<{ slug: string }>;
};

const PRODUCT_DESCRIPTION_FALLBACK =
  " — свежие цветы с доставкой по Сочи. Удобный заказ и быстрая доставка — The Ame.";

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

  const title = `Купить ${product.title} в Сочи с доставкой — цветы и подарки | The Ame`;
  const descRaw = product.shortDescription?.trim();
  const description =
    descRaw && descRaw.length > 0
      ? trimDescription(descRaw, 160)
      : `${product.title}${PRODUCT_DESCRIPTION_FALLBACK}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl(`/product/${slug}`),
    },
    robots: ROBOTS_INDEX_FOLLOW,
  };
}

function buildProductJsonLd(slug: string, product: { title: string; image: string; price: number }) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: product.image ? (product.image.startsWith("http") ? product.image : `${CANONICAL_BASE}${product.image.startsWith("/") ? "" : "/"}${product.image}`) : undefined,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "RUB",
      availability: "https://schema.org/InStock",
      url: canonicalUrl(`/product/${slug}`),
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

  const jsonLd = buildProductJsonLd(slug, product);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductPageClient
        product={product}
        productDetails={productDetails}
        addToOrderProducts={addToOrderProducts}
      />
    </>
  );
}
