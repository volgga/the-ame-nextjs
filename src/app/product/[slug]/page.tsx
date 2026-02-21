import type { Metadata } from "next";
import { getCatalogProductBySlug, getAllCatalogProducts } from "@/lib/products";
import { getProductDetails } from "@/lib/productDetails";
import { getAddOnCategoriesOrder, buildAddToOrderProducts } from "@/lib/addOnProducts";
import { notFound } from "next/navigation";
import { ProductPageClient } from "@/components/product/ProductPageClient";
import { canonicalUrl, truncateDescription, ROBOTS_INDEX_FOLLOW, CANONICAL_BASE, SITE_NAME, LOCALE } from "@/lib/seo";

export const revalidate = 300;
export const dynamicParams = true; // Остальные товары — по первому визиту (ISR), не при билде

type Props = {
  params: Promise<{ slug: string }>;
};

const PRODUCT_DESCRIPTION_FALLBACK = " — свежие цветы с доставкой по Сочи. Удобный заказ и быстрая доставка — The Ame.";

/** Лимит для экономии Egress при деплое: пререндер только топ-N по sort_order. */
const STATIC_PARAMS_LIMIT = 20;

export async function generateStaticParams() {
  const products = await getAllCatalogProducts();
  const limited = products.slice(0, STATIC_PARAMS_LIMIT);
  return limited.map((product) => ({
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

  // Ручной SEO title или автогенерация
  const title = product.seoTitle?.trim()
    ? `${product.seoTitle.trim()} | The Ame`
    : `Купить ${product.title} в Сочи с доставкой — цветы и подарки | The Ame`;
  // Ручной SEO description или описание товара или fallback
  const description = product.seoDescription?.trim()
    ? truncateDescription(product.seoDescription, 160)
    : product.shortDescription && product.shortDescription.trim().length > 0
      ? truncateDescription(product.shortDescription, 160)
      : `${product.title}${PRODUCT_DESCRIPTION_FALLBACK}`;

  const url = canonicalUrl(`/product/${slug}`);
  const ogTitle = product.ogTitle?.trim() || title;
  const ogDesc = product.ogDescription?.trim() || description;
  const imageUrl = product.ogImage?.trim()
    ? product.ogImage.startsWith("http")
      ? product.ogImage
      : `${CANONICAL_BASE}${product.ogImage.startsWith("/") ? "" : "/"}${product.ogImage}`
    : product.image
      ? product.image.startsWith("http")
        ? product.image
        : `${CANONICAL_BASE}${product.image.startsWith("/") ? "" : "/"}${product.image}`
      : `${CANONICAL_BASE}/IMG_1543.PNG`;

  return {
    title,
    description,
    ...(product.seoKeywords?.trim() && { keywords: product.seoKeywords.trim() }),
    alternates: { canonical: url },
    robots: ROBOTS_INDEX_FOLLOW,
    openGraph: {
      type: "website",
      locale: LOCALE,
      url,
      siteName: SITE_NAME,
      title: ogTitle,
      description: ogDesc,
      images: [{ url: imageUrl, width: 900, height: 900, alt: product.title }],
    },
  };
}

function buildProductJsonLd(slug: string, product: { title: string; image: string; price: number }) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: product.image
      ? product.image.startsWith("http")
        ? product.image
        : `${CANONICAL_BASE}${product.image.startsWith("/") ? "" : "/"}${product.image}`
      : undefined,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "RUB",
      availability: "https://schema.org/InStock",
      url: canonicalUrl(`/product/${slug}`),
    },
  };
}

function buildBreadcrumbJsonLd(slug: string, productTitle: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Главная",
        item: canonicalUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Каталог",
        item: canonicalUrl("/magazin"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: productTitle,
        item: canonicalUrl(`/product/${slug}`),
      },
    ],
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

  const addToOrderProducts = buildAddToOrderProducts(allCatalogProducts, addOnCategoryOrder, product.id);

  const productJsonLd = buildProductJsonLd(slug, product);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(slug, product.title);

  // Preload всех изображений товара для быстрой загрузки галереи
  const allImages = [
    product.imageLargeUrl || product.imageMediumUrl || product.imageThumbUrl || product.image,
    ...(product.images || []).slice(0, 3), // Первые 3 дополнительных изображения
  ].filter(Boolean);

  return (
    <>
      {allImages.map((imageUrl, idx) => (
        <link key={idx} rel="preload" as="image" href={imageUrl!} />
      ))}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <ProductPageClient product={product} productDetails={productDetails} addToOrderProducts={addToOrderProducts} />
    </>
  );
}
