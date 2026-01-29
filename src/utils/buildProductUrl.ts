// src/utils/buildProductUrl.ts
import { slugify } from '@/utils/slugify';

type P = {
  id: string;
  name: string;
  productSlug?: string | null;
  categorySlug?: string | null;
  categoryName?: string | null;
};

/**
 * Построение URL товара для Next.js.
 * Используем простой формат /product/[slug] для совместимости с текущей структурой.
 */
export function buildProductUrl(p: P) {
  const prod = p.productSlug || slugify(p.name);
  return `/product/${prod}`;
}
