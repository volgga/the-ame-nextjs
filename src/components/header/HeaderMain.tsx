"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { CartIcon } from "./CartIcon";
import { CatalogDropdown } from "./CatalogDropdown";
import { ClientsDropdown } from "./ClientsDropdown";
import { SearchDropdown } from "./SearchDropdown";
import { CLIENT_LINKS } from "@/lib/navLinks";
import { useFavorites } from "@/context/FavoritesContext";
import { ALL_CATALOG, CATALOG_PAGE, FALLBACK_CATEGORIES } from "@/lib/catalogCategories";

const SIDEBAR_OPEN_MS = 420;
const SIDEBAR_CLOSE_MS = 380;
const OVERLAY_MS = 320;

/** Порядок слоёв: марки 70, бежевый хедер 60, оверлей меню 80, сайдбар 85. Оверлей/сайдбар рендерятся в портал поверх всего. */
const Z_MENU_OVERLAY = 80;
const Z_MENU_SIDEBAR = 85;

const CATALOG_HREF = "/magazin";

const NAV_LINKS = [
  { href: CATALOG_HREF, label: "Каталог", isCatalog: true, isClients: false },
  { href: "/about", label: "О нас", isCatalog: false, isClients: false },
  { href: "/contacts", label: "Контакты", isCatalog: false, isClients: false },
  { href: "/delivery-and-payments", label: "Клиентам", isCatalog: false, isClients: true },
] as const;

/** Обычные ссылки сайдбара (без аккордеонов «Каталог» и «Клиентам»). */
const SIDEBAR_LINKS: { href: string; label: string }[] = [
  { href: "/about", label: "О нас" },
  { href: "/contacts", label: "Контакты" },
];

export type HeaderMainProps = {
  isMenuOpen: boolean;
  setIsMenuOpen: (v: boolean) => void;
  /** На мобиле при скрытии хедера (scroll) поиск закрывается */
  mainBarVisible?: boolean;
};

/**
 * HeaderMain — 2-я строка: бургер+лого слева, nav по центру, поиск/лайк/корзина справа.
 */
export function HeaderMain({ isMenuOpen, setIsMenuOpen, mainBarVisible = true }: HeaderMainProps) {
  const pathname = usePathname();
  const { count: favoritesCount } = useFavorites();
  const [isClosing, setIsClosing] = useState(false);
  const [isAnimateOpen, setIsAnimateOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mounted, setMounted] = useState(false);
  const prevOpenRef = useRef(false);
  /** Одна открытая секция: "catalog" | "clients" | null (взаимоисключающие аккордеоны) */
  const [openSection, setOpenSection] = useState<"catalog" | "clients" | null>(null);
  const [catalogItems, setCatalogItems] = useState<{ label: string; href: string }[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const shouldRenderMenu = isMenuOpen || isClosing;
  const isSidebarOpen = isMenuOpen && isAnimateOpen;

  // Учёт prefers-reduced-motion
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(m.matches);
    const handler = () => setReducedMotion(m.matches);
    m.addEventListener("change", handler);
    return () => m.removeEventListener("change", handler);
  }, []);

  // При закрытии меню — сворачиваем аккордеоны
  useEffect(() => {
    if (!isMenuOpen) setOpenSection(null);
  }, [isMenuOpen]);

  // При открытии сайдбара подгружаем категории каталога (тот же источник, что в чипах/фильтрах)
  useEffect(() => {
    if (!isMenuOpen) return;
    let cancelled = false;
    fetch("/api/categories")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: { name?: string; slug?: string }[]) => {
        if (cancelled || !Array.isArray(data)) return;
        const filtered = data.filter(
          (c) =>
            c.slug !== "magazin" &&
            c.slug !== "posmotret-vse-tsvety" &&
            c.name !== CATALOG_PAGE.title &&
            c.name !== ALL_CATALOG.title
        );
        const list =
          filtered.length > 0
            ? [
                { label: ALL_CATALOG.title, href: ALL_CATALOG.href },
                ...filtered.map((c) => ({
                  label: c.name ?? "",
                  href: c.slug === "posmotret-vse-tsvety" ? ALL_CATALOG.href : `/magazine/${c.slug ?? ""}`,
                })),
              ]
            : [
                { label: ALL_CATALOG.title, href: ALL_CATALOG.href },
                ...FALLBACK_CATEGORIES.map((c) => ({ label: c.label, href: `/magazine/${c.slug}` })),
              ];
        setCatalogItems(list);
      })
      .catch(() => setCatalogItems([{ label: ALL_CATALOG.title, href: ALL_CATALOG.href }, ...FALLBACK_CATEGORIES.map((c) => ({ label: c.label, href: `/magazine/${c.slug}` }))]));
    return () => {
      cancelled = true;
    };
  }, [isMenuOpen]);

  // При открытии: после монтирования запускаем анимацию выезда
  useEffect(() => {
    if (isMenuOpen) {
      setIsAnimateOpen(false);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsAnimateOpen(true));
      });
      return () => cancelAnimationFrame(id);
    } else {
      setIsAnimateOpen(false);
    }
  }, [isMenuOpen]);

  // При закрытии: держим меню в DOM и запускаем анимацию уезда
  useEffect(() => {
    if (prevOpenRef.current && !isMenuOpen) {
      setIsClosing(true);
    }
    prevOpenRef.current = isMenuOpen;
  }, [isMenuOpen]);

  // После окончания анимации закрытия — размонтируем
  useEffect(() => {
    if (!isClosing) return;
    const duration = reducedMotion ? 0 : SIDEBAR_CLOSE_MS;
    const t = setTimeout(() => setIsClosing(false), duration);
    return () => clearTimeout(t);
  }, [isClosing, reducedMotion]);

  // Закрытие по ESC
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isMenuOpen, setIsMenuOpen]);

  // Блокировка скролла страницы при открытом меню
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const iconLinkClass =
    "relative inline-flex items-center justify-center w-9 h-9 md:w-10 md:h-10 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 rounded text-header-foreground hover:opacity-80 active:opacity-60 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-header-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-header-bg";

  const sidebarLinkClass = "block";
  const sidebarContactBtnClass =
    "min-h-[44px] flex items-center justify-center py-2.5 px-3 rounded-full border-2 border-header-foreground text-header-foreground text-center text-sm font-medium";

  const navLinkBase =
    "relative text-xs md:text-sm font-medium tracking-wide uppercase transition-colors whitespace-nowrap";
  const navLinkUnderline =
    "after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-full after:bg-header-foreground after:origin-left after:transition-transform after:duration-300 after:ease-out";

  return (
    <>
      <div 
        className="relative w-full bg-header-bg flex items-center overflow-visible" 
        style={{ 
          margin: 0,
          padding: 0,
          height: "100%",
          lineHeight: "normal",
        }}
      >
        <div className="relative z-10 w-full flex items-center justify-between px-3 md:px-7 gap-4">
          <div className="relative z-10 flex items-center gap-1.5 md:gap-3 shrink-0 md:-ml-0.5">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="inline-flex items-center justify-center shrink-0 w-9 h-9 min-w-[44px] min-h-[44px] md:w-10 md:h-10 md:min-w-0 md:min-h-0 rounded text-header-foreground hover:opacity-80 active:opacity-60"
              aria-label="Открыть меню"
            >
              <svg
                className="w-6 h-6 md:w-6 md:h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link href="/" className="shrink-0 flex items-center" style={{ fontFamily: "Forum, serif", lineHeight: 1 }}>
              <span className="text-[1.8rem] md:text-[1.9rem] text-header-foreground tracking-wide leading-none">
                The Áme
              </span>
            </Link>
          </div>

          <div className="relative z-10 flex items-center gap-0.5 md:gap-2 shrink-0" style={{ paddingTop: "8px", paddingBottom: "8px", minHeight: "44px" }}>
            <SearchDropdown isHeaderBarVisible={mainBarVisible} />
            <Link
              id="header-favorites"
              href="/favorites"
              aria-label="Избранное"
              className={`${iconLinkClass} relative`}
            >
              <svg
                className="w-6 h-6 md:w-5 md:h-5 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.6}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                />
              </svg>
              {favoritesCount > 0 && (
                <span
                  className="header-icon-badge absolute z-10 min-w-[16px] h-[16px] px-1 text-[10px] font-medium flex items-center justify-center rounded-full bg-badge-bg text-badge-text pointer-events-none select-none leading-[16px]"
                  style={{ top: "4px", right: "2px", transform: "translate(35%, -25%)" }}
                  aria-hidden
                >
                  {favoritesCount > 99 ? "99+" : favoritesCount}
                </span>
              )}
            </Link>
            <CartIcon />
          </div>
        </div>

        <nav
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center justify-center pointer-events-none z-20"
          aria-label="Основное меню"
        >
          <div className="pointer-events-auto flex items-center gap-5 lg:gap-8">
            {NAV_LINKS.map(({ href, label, isCatalog, isClients }) => {
              const isClientActive = CLIENT_LINKS.some((l) => pathname === l.href);
              const isActive =
                isClients
                  ? isClientActive
                  : href === CATALOG_HREF
                    ? pathname === CATALOG_HREF ||
                      pathname.startsWith(CATALOG_HREF + "/") ||
                      pathname.startsWith("/magazine/")
                    : pathname === href;
              const linkClass = `${navLinkBase} text-header-foreground ${navLinkUnderline} ${isActive ? "after:scale-x-100" : "after:scale-x-0 hover:after:scale-x-100"}`;
              if (isCatalog) {
                return <CatalogDropdown key="catalog" triggerClassName={linkClass} isActive={isActive} />;
              }
              if (isClients) {
                return <ClientsDropdown key="clients" triggerClassName={linkClass} isActive={isActive} />;
              }
              return (
                <Link key={href + label} href={href} className={linkClass}>
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {mounted &&
        shouldRenderMenu &&
        createPortal(
          <>
            <div
              className="fixed inset-0 bg-black/70 transition-opacity"
              style={{
                zIndex: Z_MENU_OVERLAY,
                opacity: isSidebarOpen ? 1 : 0,
                transitionDuration: reducedMotion ? "0ms" : `${OVERLAY_MS}ms`,
                transitionTimingFunction: isSidebarOpen ? "ease-out" : "ease-in",
                pointerEvents: isSidebarOpen ? "auto" : "none",
              }}
              onClick={() => setIsMenuOpen(false)}
              aria-hidden={!isSidebarOpen}
            />
            <div
              className="fixed left-0 top-0 h-screen w-[68vw] max-w-[220px] sm:w-[68vw] sm:max-w-[220px] md:w-[260px] md:max-w-none lg:w-[280px] bg-header-bg text-header-foreground flex flex-col min-h-0 min-w-0 shrink-0 overflow-x-hidden transition-transform will-change-transform shadow-xl"
              style={{
                zIndex: Z_MENU_SIDEBAR,
                transform: isSidebarOpen ? "translateX(0)" : "translateX(-100%)",
                transitionDuration: reducedMotion
                  ? "0ms"
                  : isSidebarOpen
                    ? `${SIDEBAR_OPEN_MS}ms`
                    : `${SIDEBAR_CLOSE_MS}ms`,
                transitionTimingFunction: isSidebarOpen ? "ease-out" : "ease-in-out",
              }}
              role="dialog"
              aria-modal="true"
              aria-label="Меню навигации"
            >
              {/* Внутренний контейнер: min-w-0 w-full — контент не раздувает drawer */}
              <div className="min-w-0 w-full max-w-full flex-1 flex flex-col min-h-0 overflow-x-hidden px-4 pb-4 pt-0">
              {/* A) Top: лого (ссылка на главную) + ссылки */}
              <div className="shrink-0 min-w-0 pt-6 pb-4" style={{ fontFamily: "Forum, serif" }}>
                <Link href="/" onClick={() => setIsMenuOpen(false)} className="block text-4xl leading-none text-header-foreground">
                  The Áme
                </Link>
              </div>
              <nav className="shrink-0 min-w-0" aria-label="Навигация">
                <ul className="space-y-2">
                  {/* Каталог — раскрывающийся список категорий (без навигации по клику на заголовок) */}
                  <li>
                    <button
                      type="button"
                      onClick={() => setOpenSection((s) => (s === "catalog" ? null : "catalog"))}
                      className={`${sidebarLinkClass} w-full text-left flex items-center justify-between gap-2`}
                      aria-expanded={openSection === "catalog"}
                      aria-controls="sidebar-catalog-list"
                    >
                      <span>Каталог</span>
                      <ChevronDown className={`w-4 h-4 shrink-0 text-header-foreground ${openSection === "catalog" ? "rotate-180" : ""}`} strokeWidth={2} aria-hidden />
                    </button>
                    <div
                      className="grid overflow-hidden"
                      style={{
                        gridTemplateRows: openSection === "catalog" ? "1fr" : "0fr",
                        transition: reducedMotion ? "none" : "grid-template-rows 0.25s ease-out",
                      }}
                    >
                      <div className="min-h-0">
                        <ul id="sidebar-catalog-list" className="mt-1 space-y-1 pl-4 border-l-2 border-header-foreground" aria-label="Подменю Каталог">
                          {catalogItems.map((item) => (
                            <li key={item.href + item.label}>
                              <Link href={item.href} onClick={() => setIsMenuOpen(false)} className={sidebarLinkClass}>
                                {item.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </li>
                  {SIDEBAR_LINKS.map(({ href, label }) => (
                    <li key={href + label}>
                      <Link href={href} onClick={() => setIsMenuOpen(false)} className={sidebarLinkClass}>
                        {label}
                      </Link>
                    </li>
                  ))}
                  {/* Клиентам — раскрывающийся список (без навигации по клику на заголовок) */}
                  <li>
                    <button
                      type="button"
                      onClick={() => setOpenSection((s) => (s === "clients" ? null : "clients"))}
                      className={`${sidebarLinkClass} w-full text-left flex items-center justify-between gap-2`}
                      aria-expanded={openSection === "clients"}
                      aria-controls="sidebar-clients-list"
                    >
                      <span>Клиентам</span>
                      <ChevronDown className={`w-4 h-4 shrink-0 text-header-foreground ${openSection === "clients" ? "rotate-180" : ""}`} strokeWidth={2} aria-hidden />
                    </button>
                    <div
                      className="grid overflow-hidden"
                      style={{
                        gridTemplateRows: openSection === "clients" ? "1fr" : "0fr",
                        transition: reducedMotion ? "none" : "grid-template-rows 0.25s ease-out",
                      }}
                    >
                      <div className="min-h-0">
                        <ul id="sidebar-clients-list" className="mt-1 space-y-1 pl-4 border-l-2 border-header-foreground" aria-label="Подменю Клиентам">
                          {CLIENT_LINKS.map(({ href, label }) => (
                            <li key={href + label}>
                              <Link href={href} onClick={() => setIsMenuOpen(false)} className={sidebarLinkClass}>
                                {label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </li>
                </ul>
              </nav>

              {/* Соцсети + адрес: сразу под первой группой меню. Mobile: номер и кнопки по одной оси, по левому краю */}
              <div className="shrink-0 min-w-0 pt-4 text-left">
                <h3 className="text-base font-normal text-header-foreground mb-3 antialiased">Мы в соц. сетях</h3>
                {/* Mobile: номер и кнопки в одной колонке, выравнивание по левому краю (как пункты меню), ширина по контенту */}
                {/* Контейнер контактов (mobile): inline-flex, ширина по телефону; соцкнопки w-full = той же ширины, один столбец */}
                <div className="inline-flex flex-col items-stretch w-fit min-w-0 md:contents">
                  <a
                    href="tel:+79939326095"
                    onClick={() => setIsMenuOpen(false)}
                    className="md:hidden block w-fit text-left py-2.5 text-header-foreground text-sm font-medium mb-2 hover:opacity-80 no-underline"
                  >
                    +7 993 932-60-95
                  </a>
                  <div className="grid w-full min-w-0 grid-cols-1 gap-2 place-items-stretch md:w-full md:grid-cols-2 md:gap-2 sm:gap-3 md:place-items-stretch">
                  <a
                    href="tel:+79939326095"
                    onClick={() => setIsMenuOpen(false)}
                    className={`hidden md:flex col-span-2 ${sidebarContactBtnClass}`}
                  >
                    Позвонить нам
                  </a>
                  <a
                    href="https://t.me/the_ame_flowers"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMenuOpen(false)}
                    className={`w-full min-w-0 py-2 px-3 min-h-[40px] md:w-full md:py-2.5 md:min-h-[44px] ${sidebarContactBtnClass}`}
                  >
                    Telegram
                  </a>
                  <a
                    href="https://www.instagram.com/theame.flowers"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMenuOpen(false)}
                    className={`w-full min-w-0 py-2 px-3 min-h-[40px] md:w-full md:py-2.5 md:min-h-[44px] ${sidebarContactBtnClass}`}
                  >
                    Instagram
                  </a>
                  <a
                    href="https://wa.me/message/XQDDWGSEL35LP1"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMenuOpen(false)}
                    className={`w-full min-w-0 py-2 px-3 min-h-[40px] md:w-full md:py-2.5 md:min-h-[44px] ${sidebarContactBtnClass}`}
                  >
                    WhatsApp
                  </a>
                  <a
                    href="https://max.ru/u/f9LHodD0cOJJBRShH_taOp567aS5B7oZt4PZHqOvsl782HDW1tNY1II4OTY"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMenuOpen(false)}
                    className={`w-full min-w-0 py-2 px-3 min-h-[40px] md:w-full md:py-2.5 md:min-h-[44px] ${sidebarContactBtnClass}`}
                  >
                    Max
                  </a>
                </div>
                </div>
                <footer className="pt-4 text-sm opacity-85 leading-relaxed min-w-0 max-w-full overflow-hidden w-full">
                  <a
                    href="https://yandex.ru/maps/239/sochi/?from=mapframe&ll=39.732810%2C43.615391&mode=poi&poi%5Buri%5D=ymapsbm1%3A%2F%2Forg%3Foid%3D77269998905&source=mapframe&utm_source=mapframe&z=19"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-90 transition-opacity text-sm leading-snug break-words whitespace-normal max-w-full overflow-hidden w-full block min-w-0 text-left"
                  >
                    Пластунская 123А, корпус 2, этаж 2, офис 84
                  </a>
                  <div className="max-w-full whitespace-normal break-words min-w-0 w-full">Пн–Вс с 09:00 до 21:00</div>
                </footer>
              </div>
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  );
}
