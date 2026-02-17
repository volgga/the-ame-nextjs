"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { ALL_CATALOG, CATALOG_PAGE, FALLBACK_CATEGORIES } from "@/lib/catalogCategories";

/** Строго 4 колонки, максимум 4 строки в колонке (4×4). */
const COLUMNS_COUNT = 4;
const MAX_ROWS_PER_COLUMN = 4;
const MAX_ITEMS = COLUMNS_COUNT * MAX_ROWS_PER_COLUMN; // 16

type MenuItem = { label: string; href: string };

async function fetchCategories(): Promise<{ name: string; slug: string }[]> {
  try {
    const res = await fetch("/api/categories");
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((c: { name?: string; slug?: string }) => ({
      name: c.name ?? "",
      slug: c.slug ?? "",
    }));
  } catch {
    return [];
  }
}

/** slug → href: posmotret-vse-tsvety → страница "Все цветы", остальные → /magazine/[slug]. slug "magazin" в список не попадает. */
function categoryHref(slug: string): string {
  if (slug === "posmotret-vse-tsvety") return "/posmotret-vse-tsvety";
  return `/magazine/${slug}`;
}

/** Раскладка по строкам: строка 1 = [1,2,3,4], строка 2 = [5,6,7,8], … */
function splitIntoRows<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  for (let r = 0; r < MAX_ROWS_PER_COLUMN; r++) {
    const start = r * COLUMNS_COUNT;
    const row = items.slice(start, start + COLUMNS_COUNT);
    if (row.length > 0) rows.push(row);
  }
  return rows;
}

/** Список для выпадающего меню: первым "Все цветы", далее категории. Исключаем magazin, posmotret-vse-tsvety, "Каталог" и дубли "Все цветы". */
function buildMenuItems(categories: { name: string; slug: string }[]): MenuItem[] {
  const withoutMagazin = categories.filter(
    (c) => c.slug !== "magazin" && c.slug !== "posmotret-vse-tsvety" && c.name !== "Каталог" && c.name !== "Все цветы"
  );
  const list =
    withoutMagazin.length > 0
      ? [
          { label: ALL_CATALOG.title, href: ALL_CATALOG.href },
          ...withoutMagazin.map((c) => ({ label: c.name, href: categoryHref(c.slug) })),
        ]
      : [
          { label: ALL_CATALOG.title, href: ALL_CATALOG.href },
          ...FALLBACK_CATEGORIES.map((c) => ({ label: c.label, href: `/magazine/${c.slug}` })),
        ];
  return list.length > MAX_ITEMS ? list.slice(0, MAX_ITEMS) : list;
}

const COLUMN_MIN_WIDTH = 180;
const ROW_GAP = 12;
const COLUMN_GAP = 36;

type CatalogDropdownProps = {
  triggerClassName: string;
  isActive: boolean;
};

export function CatalogDropdown({ triggerClassName }: CatalogDropdownProps) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const menuItems = useMemo(() => buildMenuItems(categories), [categories]);
  const rows = useMemo(() => splitIntoRows(menuItems), [menuItems]);

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(id);
    } else {
      setVisible(false);
    }
  }, [open]);

  const handleOpen = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpen(true);
  };

  const handleClose = () => {
    closeTimeoutRef.current = setTimeout(() => setOpen(false), 150);
  };

  const close = () => setOpen(false);

  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(pointer: coarse)");
    setIsTouch(m.matches);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={isTouch ? undefined : handleOpen}
      onMouseLeave={isTouch ? undefined : handleClose}
    >
      <Link
        href={CATALOG_PAGE.href}
        className={triggerClassName}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="catalog-dropdown-menu"
        id="catalog-dropdown-trigger"
        onClick={
          isTouch
            ? (e) => {
                e.preventDefault();
                setOpen((v) => !v);
              }
            : undefined
        }
      >
        Каталог
      </Link>

      {open && (
        <div
          id="catalog-dropdown-menu"
          role="menu"
          aria-labelledby="catalog-dropdown-trigger"
          className="absolute left-1/2 top-full z-[100]"
          style={{
            transform: "translateX(-50%)",
            paddingTop: "20px",
          }}
          onMouseEnter={handleOpen}
          onMouseLeave={handleClose}
        >
          <div
            className="overflow-hidden bg-white transition-all duration-200 ease-out border border-[#1F2A1F]"
            style={{
              padding: "22px 26px",
              width: "max-content",
              maxWidth: "min(980px, calc(100vw - 24px))",
              borderRadius: "22px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(-8px)",
              transition: "opacity 200ms ease-out, transform 200ms ease-out",
            }}
          >
            <div className="flex flex-col" style={{ gap: ROW_GAP }}>
              {rows.map((row, rowIdx) => (
                <div
                  key={rowIdx}
                  className="flex flex-wrap gap-x-8 gap-y-1"
                  style={{ minWidth: COLUMN_MIN_WIDTH }}
                >
                  {row.map((item, itemIdx) => {
                    const isFirst = rowIdx === 0 && itemIdx === 0;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        className={
                          isFirst
                            ? "block py-0.5 text-sm font-semibold text-color-text-main hover:opacity-80 hover:underline decoration-2 underline-offset-2 transition-colors leading-tight shrink-0"
                            : "block py-0.5 text-sm text-color-text-secondary hover:text-color-text-main hover:underline decoration-2 underline-offset-2 transition-colors leading-tight shrink-0"
                        }
                        style={{ minWidth: COLUMN_MIN_WIDTH }}
                        onClick={close}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
