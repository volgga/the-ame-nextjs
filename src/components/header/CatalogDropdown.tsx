"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { ALL_CATALOG, FALLBACK_CATEGORIES } from "@/lib/catalogCategories";

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

function buildMenuItems(categories: { name: string; slug: string }[]): MenuItem[] {
  const list =
    categories.length > 0
      ? categories.map((c) => ({ label: c.name, href: `/magazine/${c.slug}` }))
      : FALLBACK_CATEGORIES.map((c) => ({ label: c.label, href: `/magazine/${c.slug}` }));
  const full = [{ label: ALL_CATALOG.title, href: ALL_CATALOG.href }, ...list];
  return full.length > MAX_ITEMS ? full.slice(0, MAX_ITEMS) : full;
}

/** Раскладка строго по 4 колонкам: col0 = [0..3], col1 = [4..7], col2 = [8..11], col3 = [12..15]. */
function splitIntoFourColumns<T>(items: T[]): T[][] {
  const columns: T[][] = [];
  for (let c = 0; c < COLUMNS_COUNT; c++) {
    const start = c * MAX_ROWS_PER_COLUMN;
    columns.push(items.slice(start, start + MAX_ROWS_PER_COLUMN));
  }
  return columns;
}

const COLUMN_MIN_WIDTH = 160;
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
  const columns = useMemo(() => splitIntoFourColumns(menuItems), [menuItems]);

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
    closeTimeoutRef.current = setTimeout(() => setOpen(false), 100);
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
        href={ALL_CATALOG.href}
        className={triggerClassName}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="catalog-dropdown-menu"
        id="catalog-dropdown-trigger"
        onClick={isTouch ? (e) => { e.preventDefault(); setOpen((v) => !v); } : undefined}
      >
        Каталог
      </Link>

      {open && (
        <div
          id="catalog-dropdown-menu"
          role="menu"
          aria-labelledby="catalog-dropdown-trigger"
          className="absolute left-1/2 top-full z-[65]"
          style={{
            transform: "translateX(-50%)",
            paddingTop: "20px",
          }}
          onMouseEnter={handleOpen}
          onMouseLeave={handleClose}
        >
          <div
            className="overflow-hidden bg-white transition-all duration-200 ease-out"
            style={{
              padding: "22px 26px",
              width: "fit-content",
              maxWidth: "min(980px, calc(100vw - 24px))",
              borderRadius: "22px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(-8px)",
              transition: "opacity 200ms ease-out, transform 200ms ease-out",
            }}
          >
            <div
              className="flex items-start"
              style={{ gap: COLUMN_GAP }}
            >
              {columns.map((col, colIdx) => (
                <div
                  key={colIdx}
                  className="flex shrink-0 flex-col"
                  style={{
                    gap: "12px",
                    minWidth: COLUMN_MIN_WIDTH,
                  }}
                >
                  {col.map((item, itemIdx) => {
                    const isFirst = colIdx === 0 && itemIdx === 0;
                    return (
                      <Link
                        key={item.href + item.label}
                        href={item.href}
                        role="menuitem"
                        className={
                          isFirst
                            ? "block py-0.5 text-sm font-semibold text-color-text-main hover:opacity-80 hover:underline decoration-2 underline-offset-2 transition-colors leading-tight"
                            : "block py-0.5 text-sm text-color-text-secondary hover:text-color-text-main hover:underline decoration-2 underline-offset-2 transition-colors leading-tight"
                        }
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
