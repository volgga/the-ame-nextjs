"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FALLBACK_CATEGORIES } from "@/lib/catalogCategories";

const CATALOG_HREF = "/catalog";

function getCategoryHref(slug: string) {
  return `${CATALOG_HREF}/${slug}`;
}

type CatalogDropdownProps = {
  /** Базовые классы для триггера (как у остальных nav-ссылок). */
  triggerClassName: string;
  /** Активен ли пункт (каталог открыт). */
  isActive: boolean;
};

export function CatalogDropdown({ triggerClassName, isActive }: CatalogDropdownProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const m = window.matchMedia("(pointer: coarse)");
    setIsTouch(m.matches);
  }, []);

  const close = () => setOpen(false);

  // Закрытие по клику вне
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

  // Закрытие по ESC
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);


  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseLeave={isTouch ? undefined : () => setOpen(false)}
    >
      <Link
        href={CATALOG_HREF}
        className={triggerClassName}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="catalog-dropdown-menu"
        id="catalog-dropdown-trigger"
        onClick={isTouch ? (e) => { e.preventDefault(); setOpen((v) => !v); } : undefined}
        onMouseEnter={!isTouch ? () => setOpen(true) : undefined}
      >
        Каталог
      </Link>

      {open && (
        <div
          id="catalog-dropdown-menu"
          role="menu"
          aria-labelledby="catalog-dropdown-trigger"
          className="absolute left-1/2 top-full -translate-x-1/2 pt-1 min-w-[200px] z-[65]"
        >
          <div className="rounded-lg bg-white py-2 shadow-[0_4px_20px_rgba(0,0,0,0.12)]">
            {FALLBACK_CATEGORIES.map(({ label, slug }) => (
              <Link
                key={slug}
                href={getCategoryHref(slug)}
                role="menuitem"
                className="block px-4 py-2.5 text-sm text-[#333] hover:bg-[#819570]/10 hover:text-[#819570] focus:bg-[#819570]/10 focus:text-[#819570] focus:outline-none"
                onClick={close}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
