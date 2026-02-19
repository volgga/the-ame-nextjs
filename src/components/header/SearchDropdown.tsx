"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AppImage } from "@/components/ui/AppImage";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/utils/formatPrice";
import { buildProductUrl } from "@/utils/buildProductUrl";

export type SearchProductItem = {
  id: string;
  slug: string;
  title: string;
  price: number;
  image: string;
  shortDescription: string;
  categories?: string[];
};

const MIN_TOKEN_LEN = 2;
const STEM_LEN = 4;

function normalize(s: string): string {
  return s.toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ").trim();
}

function tokenize(query: string): string[] {
  return query
    .split(/\s+/)
    .map((w) => normalize(w))
    .filter((w) => w.length >= MIN_TOKEN_LEN);
}

function stem(word: string): string {
  return word.slice(0, STEM_LEN);
}

/**
 * Поиск по товарам: точное совпадение (includes) + "похожие" по основе слова.
 * Точные совпадения сортируются выше.
 */
function searchProducts(products: SearchProductItem[], query: string): SearchProductItem[] {
  const qNorm = normalize(query);
  if (!qNorm) return [];

  const tokens = tokenize(query);
  const stems = tokens.map(stem);

  const scored = products
    .map((p) => {
      const titleNorm = normalize(p.title);
      const descNorm = normalize(p.shortDescription);
      const catNorm = (p.categories ?? []).map(normalize).join(" ");
      const searchable = `${titleNorm} ${descNorm} ${catNorm}`;

      // Приоритет 1: полное совпадение запроса в названии
      if (titleNorm.includes(qNorm)) return { product: p, score: 100 };

      // Приоритет 2: полное совпадение в searchable
      if (searchable.includes(qNorm)) return { product: p, score: 80 };

      // Приоритет 3: хотя бы один стем совпадает
      const matchCount = stems.filter((s) => searchable.includes(s)).length;
      if (matchCount > 0) return { product: p, score: 50 + matchCount };

      return null;
    })
    .filter((x): x is { product: SearchProductItem; score: number } => x !== null);

  scored.sort((a, b) => b.score - a.score);
  return scored.map((x) => x.product);
}

const HEADER_ICON_CLASS =
  "relative inline-flex items-center justify-center w-9 h-9 min-w-[44px] min-h-[44px] md:w-10 md:h-10 md:min-w-0 md:min-h-0 rounded text-header-foreground hover:opacity-80 active:opacity-60 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-header-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-header-bg";

const HEADER_HEIGHT_MOBILE_PX = 76; // marquee 32 + main bar 44

type SearchDropdownProps = {
  onClose?: () => void;
  /** На мобиле при скрытии хедера (scroll) закрываем поиск */
  isHeaderBarVisible?: boolean;
};

export function SearchDropdown({ onClose, isHeaderBarVisible = true }: SearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<SearchProductItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const m = window.matchMedia("(max-width: 767px)");
    setIsMobile(m.matches);
    const handler = () => setIsMobile(m.matches);
    m.addEventListener("change", handler);
    return () => m.removeEventListener("change", handler);
  }, []);

  const results = useMemo(() => (query.trim() ? searchProducts(products, query) : []), [products, query]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      }
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
    setQuery("");
    fetchProducts();
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [fetchProducts]);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    onClose?.();
  }, [onClose]);

  useEffect(() => {
    if (isHeaderBarVisible === false) close();
  }, [isHeaderBarVisible, close]);

  const handleProductClick = useCallback(
    (e: React.MouseEvent, product: SearchProductItem) => {
      e.preventDefault();
      const href = buildProductUrl({
        name: product.title,
        productSlug: product.slug ?? null,
      });
      close();
      router.push(href);
    },
    [close, router]
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      const inContainer = containerRef.current?.contains(target);
      const inPanel = panelRef.current?.contains(target);
      if (!inContainer && !inPanel) close();
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, close]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close]);

  return (
    <div ref={containerRef} className="relative z-20 shrink-0">
      <button
        type="button"
        onClick={open}
        aria-label="Поиск товаров"
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={HEADER_ICON_CLASS}
      >
        <svg
          className="w-6 h-6 md:w-5 md:h-5 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
      </button>

      {isOpen &&
        (isMobile ? (
          createPortal(
            <div
              ref={panelRef}
              className="fixed left-2 right-2 z-[75] w-[calc(100vw-16px)] max-w-[400px] mx-auto bg-white border border-[#1F2A1F] rounded-xl shadow-xl overflow-hidden"
              style={{ top: HEADER_HEIGHT_MOBILE_PX + 8 }}
              role="dialog"
              aria-label="Поиск товаров"
            >
              <div className="p-3 border-b border-gray-200">
                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Поиск товаров…"
                  className="w-full px-3 py-2 text-sm text-color-text-main bg-page-bg border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-header-foreground focus:ring-offset-1"
                  autoComplete="off"
                  aria-label="Поисковый запрос"
                />
              </div>
              <div className="max-h-[320px] overflow-y-auto">
                {loading ? (
                  <div className="py-8 text-center text-sm text-color-text-secondary">Загрузка…</div>
                ) : query.trim() === "" ? (
                  <div className="py-6 text-center text-sm text-color-text-secondary">Введите запрос для поиска</div>
                ) : results.length === 0 ? (
                  <div className="py-8 text-center text-sm text-color-text-secondary">Ничего не найдено</div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {results.slice(0, 8).map((product) => (
                      <li key={product.id}>
                        <Link
                          href={buildProductUrl({
                            name: product.title,
                            productSlug: product.slug ?? null,
                          })}
                          onClick={(e) => handleProductClick(e, product)}
                          className="flex gap-3 p-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[#ece9e2] shrink-0">
                            <AppImage
                              src={
                                product.image?.trim() &&
                                (product.image.startsWith("http") || product.image.startsWith("/"))
                                  ? product.image
                                  : "/placeholder.svg"
                              }
                              alt={product.title}
                              fill
                              variant="thumb"
                              sizes="48px"
                              className="object-cover"
                              loading="lazy"
                              // TODO: Добавить imageData когда SearchDropdown будет получать полные Product объекты
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-color-text-main line-clamp-2">{product.title}</p>
                            <p className="text-xs text-color-text-secondary mt-0.5">{formatPrice(product.price)}</p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>,
            document.body
          )
        ) : (
          <div
            className="absolute right-0 top-full z-[75] mt-2 w-[min(400px,calc(100vw-32px))] bg-white border border-[#1F2A1F] rounded-xl shadow-xl overflow-hidden"
            role="dialog"
            aria-label="Поиск товаров"
          >
            <div className="p-3 border-b border-gray-200">
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск товаров…"
                className="w-full px-3 py-2 text-sm text-color-text-main bg-page-bg border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-header-foreground focus:ring-offset-1"
                autoComplete="off"
                aria-label="Поисковый запрос"
              />
            </div>
            <div className="max-h-[320px] overflow-y-auto">
              {loading ? (
                <div className="py-8 text-center text-sm text-color-text-secondary">Загрузка…</div>
              ) : query.trim() === "" ? (
                <div className="py-6 text-center text-sm text-color-text-secondary">Введите запрос для поиска</div>
              ) : results.length === 0 ? (
                <div className="py-8 text-center text-sm text-color-text-secondary">Ничего не найдено</div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {results.slice(0, 8).map((product) => (
                    <li key={product.id}>
                      <Link
                        href={buildProductUrl({
                          name: product.title,
                          productSlug: product.slug ?? null,
                        })}
                        onClick={(e) => handleProductClick(e, product)}
                        className="flex gap-3 p-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[#ece9e2] shrink-0">
                          <AppImage
                            src={
                              product.image?.trim() &&
                              (product.image.startsWith("http") || product.image.startsWith("/"))
                                ? product.image
                                : "/placeholder.svg"
                            }
                            alt={product.title}
                            fill
                            sizes="48px"
                            variant="thumb"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-color-text-main line-clamp-2">{product.title}</p>
                          <p className="text-xs text-color-text-secondary mt-0.5">{formatPrice(product.price)}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
    </div>
  );
}
