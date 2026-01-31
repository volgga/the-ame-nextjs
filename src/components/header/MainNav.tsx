"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/catalog", label: "Каталог" },
  { href: "/contacts", label: "Компаниям" },
  { href: "/about", label: "О нас" },
  { href: "/contacts", label: "Контакты" },
] as const;

const TOP_BAR_H = 36;
const HEADER_MAIN_H = 48;

/**
 * MainNav — третья строка шапки (flowerna-style): центрированное меню в одну линию.
 * На мобилке скрыто (пункты доступны в бургер-меню).
 */
export function MainNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed left-0 right-0 z-[54] bg-[#ffe9c3] border-b border-[#819570]/15 hidden md:block"
      style={{ top: TOP_BAR_H + HEADER_MAIN_H }}
      aria-label="Основное меню"
    >
      <div className="h-11 flex items-center justify-center gap-6 lg:gap-8 px-4">
        {NAV_LINKS.map(({ href, label }) => {
          const isActive =
            href === "/catalog"
              ? pathname === "/catalog" || pathname.startsWith("/catalog/")
              : pathname === href;
          return (
            <Link
              key={href + label}
              href={href}
              className={`text-sm font-medium tracking-wide uppercase transition-colors ${
                isActive
                  ? "text-[#819570] border-b-2 border-[#819570] pb-0.5"
                  : "text-[#819570]/80 hover:text-[#819570]"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export const MAIN_NAV_HEIGHT = 44;
