"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CartIcon } from "./CartIcon";
import { CatalogDropdown } from "./CatalogDropdown";

const SIDEBAR_OPEN_MS = 420;
const SIDEBAR_CLOSE_MS = 380;
const OVERLAY_MS = 320;

/** Порядок слоёв: марки 70, бежевый хедер 60, оверлей меню 80, сайдбар 85. Оверлей/сайдбар рендерятся в портал поверх всего. */
const Z_MENU_OVERLAY = 80;
const Z_MENU_SIDEBAR = 85;

const CATALOG_HREF = "/posmotret-vse-tsvety";

const NAV_LINKS = [
  { href: CATALOG_HREF, label: "Каталог", isCatalog: true },
  { href: "/about", label: "О нас", isCatalog: false },
  { href: "/contacts", label: "Контакты", isCatalog: false },
] as const;

/** Ссылки сайдбара: Top-зона (лого + этот список) + Center (соц-блок) + Bottom (адрес). */
const SIDEBAR_LINKS: { href: string; label: string }[] = [
  { href: "/", label: "Главная" },
  { href: CATALOG_HREF, label: "Каталог" },
  { href: "/about", label: "О нас" },
  { href: "/contacts", label: "Контакты" },
  { href: "/delivery-and-payments", label: "Клиентам" },
  { href: "/delivery-and-payments", label: "Доставка и оплата" },
  { href: "/docs/return", label: "Условия возврата" },
  { href: "/docs/care", label: "Инструкция по уходу" },
];

export type HeaderMainProps = {
  isMenuOpen: boolean;
  setIsMenuOpen: (v: boolean) => void;
};

/**
 * HeaderMain — 2-я строка: бургер+лого слева, nav по центру, поиск/лайк/корзина справа.
 */
export function HeaderMain({ isMenuOpen, setIsMenuOpen }: HeaderMainProps) {
  const pathname = usePathname();
  const [isClosing, setIsClosing] = useState(false);
  const [isAnimateOpen, setIsAnimateOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mounted, setMounted] = useState(false);
  const prevOpenRef = useRef(false);

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
    "relative inline-flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded text-header-foreground hover:opacity-80 active:opacity-60 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-header-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-header-bg";

  const sidebarLinkClass = "block";
  const sidebarContactBtnClass =
    "min-h-[44px] flex items-center justify-center py-2.5 px-3 rounded-full border-2 border-header-foreground text-header-foreground text-center text-sm font-medium";

  const navLinkBase = "relative text-xs md:text-sm font-medium tracking-wide uppercase transition-colors whitespace-nowrap";
  const navLinkHoverUnderline =
    "after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-full after:bg-header-foreground after:origin-left after:scale-x-0 after:transition-transform after:duration-300 after:ease-out hover:after:scale-x-100";

  return (
    <>
    <div className="relative w-full bg-header-bg">
      <div className="w-full min-h-[48px] py-2 flex items-center justify-between px-4 md:px-6 gap-4">
        <div className="relative z-10 flex items-center gap-2 md:gap-3 shrink-0 -ml-1 md:-ml-0.5">
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            className="inline-flex items-center justify-center shrink-0 w-9 h-9 md:w-10 md:h-10 rounded text-header-foreground hover:opacity-80 active:opacity-60"
            aria-label="Открыть меню"
          >
            <svg
              className="w-5 h-5 md:w-6 md:h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link href="/" className="shrink-0" style={{ fontFamily: "Forum, serif" }}>
            <span className="text-[1.75rem] md:text-[2.1rem] text-header-foreground tracking-wide leading-none">
              The Áme
            </span>
          </Link>
        </div>

        <div className="relative z-10 flex items-center gap-4 md:gap-6 shrink-0">
          <Link
            href={CATALOG_HREF}
            aria-label="Поиск / Каталог"
            className={iconLinkClass}
          >
            <svg
              className="w-5 h-5 md:w-6 md:h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </Link>
          <Link href="/favorites" aria-label="Избранное" className={iconLinkClass}>
            <svg
              className="w-5 h-5 md:w-6 md:h-6"
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
          </Link>
          <CartIcon />
        </div>
      </div>

      <nav
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center justify-center pointer-events-none"
        aria-label="Основное меню"
      >
        <div className="pointer-events-auto flex items-center gap-5 lg:gap-8">
          {NAV_LINKS.map(({ href, label, isCatalog }) => {
            const isActive =
              href === CATALOG_HREF
                ? pathname === CATALOG_HREF ||
                  pathname.startsWith(CATALOG_HREF + "/") ||
                  pathname.startsWith("/magazine/")
                : pathname === href;
            const linkClass = `${navLinkBase} ${isActive ? "text-header-foreground border-b-2 border-header-foreground pb-0.5" : `text-header-foreground ${navLinkHoverUnderline}`}`;
            if (isCatalog) {
              return (
                <CatalogDropdown
                  key="catalog"
                  triggerClassName={linkClass}
                  isActive={isActive}
                />
              );
            }
            return (
              <Link
                key={href + label}
                href={href}
                className={linkClass}
              >
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
              className="fixed left-0 top-0 h-screen w-[75vw] sm:w-[55vw] md:w-[260px] lg:w-[280px] bg-header-bg text-header-foreground px-4 pb-4 pt-0 flex flex-col min-h-0 transition-transform will-change-transform shadow-xl"
              style={{
                zIndex: Z_MENU_SIDEBAR,
                transform: isSidebarOpen ? "translateX(0)" : "translateX(-100%)",
                transitionDuration: reducedMotion ? "0ms" : isSidebarOpen ? `${SIDEBAR_OPEN_MS}ms` : `${SIDEBAR_CLOSE_MS}ms`,
                transitionTimingFunction: isSidebarOpen ? "ease-out" : "ease-in-out",
              }}
              role="dialog"
              aria-modal="true"
              aria-label="Меню навигации"
            >
                {/* A) Top: лого + ссылки (pt-6 — верхний отступ, чтобы лого не прилипало к краю) */}
                <div className="shrink-0 pt-6 pb-4" style={{ fontFamily: "Forum, serif" }}>
                  <div className="text-4xl leading-none">The Áme</div>
                </div>
                <nav className="shrink-0" aria-label="Навигация">
                  <ul className="space-y-2">
                    {SIDEBAR_LINKS.map(({ href, label }) => (
                      <li key={href + label}>
                        <Link href={href} onClick={() => setIsMenuOpen(false)} className={sidebarLinkClass}>
                          {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>

                {/* B) Center: соц-блок (flex-1 spacers центрируют по вертикали) */}
                <div className="flex-1 min-h-0" aria-hidden />
                <div className="shrink-0 text-left my-auto">
                  <h3 className="text-base font-normal text-header-foreground mb-3 antialiased">
                    Мы в социальных сетях
                  </h3>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <a
                      href="tel:+79939326095"
                      onClick={() => setIsMenuOpen(false)}
                      className={`col-span-2 ${sidebarContactBtnClass}`}
                    >
                      Позвонить нам
                    </a>
                    <a
                      href="https://t.me/the_ame_flowers"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsMenuOpen(false)}
                      className={sidebarContactBtnClass}
                    >
                      Telegram
                    </a>
                    <a
                      href="https://www.instagram.com/theame.flowers"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsMenuOpen(false)}
                      className={sidebarContactBtnClass}
                    >
                      Instagram
                    </a>
                    <a
                      href="https://wa.me/message/XQDDWGSEL35LP1"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsMenuOpen(false)}
                      className={sidebarContactBtnClass}
                    >
                      WhatsApp
                    </a>
                    <a
                      href="https://max.ru/u/f9LHodD0cOJJBRShH_taOp567aS5B7oZt4PZHqOvsl782HDW1tNY1II4OTY"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsMenuOpen(false)}
                      className={sidebarContactBtnClass}
                    >
                      Max
                    </a>
                  </div>
                </div>
                <div className="flex-1 min-h-0" aria-hidden />

                {/* C) Bottom: адрес */}
                <footer className="shrink-0 pt-4 mt-auto text-sm opacity-85 leading-relaxed">
                  <div>Пластунская 123А, корпус 2, этаж 2, офис 84</div>
                  <div>Пн–Вс с 09:00 до 21:00</div>
                </footer>
              </div>
          </>,
          document.body
        )}
    </>
  );
}
