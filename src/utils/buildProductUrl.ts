// src/utils/buildProductUrl.ts
import { slugify } from "@/utils/slugify";

type BuildProductUrlParams = {
  name: string;
  productSlug?: string | null;
};

/**
 * Построение URL товара для Next.js.
 * Используем простой формат /product/[slug] для совместимости с текущей структурой.
 */
export function buildProductUrl(p: BuildProductUrlParams): string {
  const slug = p.productSlug?.trim() || slugify(p.name);
  return `/product/${slug || "product"}`;
}
