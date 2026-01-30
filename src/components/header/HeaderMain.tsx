"use client";

import { useState } from "react";
import Link from "next/link";
import { CartIcon } from "./CartIcon";

/**
 * HeaderMain — верхняя плашка с меню, телефоном, иконками и корзиной.
 */
export function HeaderMain() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Общий класс для всех иконок справа
  const iconLinkClass =
    "relative inline-flex items-center justify-center text-[#819570]/95 hover:text-[#819570] transition";

  return (
    <div className="fixed inset-x-0 top-9 z-[55] bg-[#ffe9c3]">
      <div className="w-full h-12 flex items-center">
        {/* Меню слева */}
        <div className="pl-2">
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            className="inline-flex items-center gap-2 select-none"
          >
            <svg
              className="w-6 h-6 text-[#819570]"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
            {/* Текст "Меню" скрыт на мобиле, виден с md+ */}
            <span className="hidden md:inline text-sm font-medium tracking-wide text-[#819570] uppercase">
              Меню
            </span>
          </button>

          {/* Боковое меню (упрощённая версия без Sheet) */}
          {isMenuOpen && (
            <>
              {/* Затемнение */}
              <div
                className="fixed inset-0 bg-black/20 z-[60]"
                onClick={() => setIsMenuOpen(false)}
                aria-hidden
              />
              {/* Меню */}
              <div className="fixed left-0 top-9 bottom-0 w-[80vw] sm:w-[65vw] md:w-[22rem] lg:w-[26rem] max-w-[420px] bg-[#ffe9c3] text-[#819570] z-[65] p-6 overflow-y-auto">
                <div className="mb-6" style={{ fontFamily: "Forum, serif" }}>
                  <div className="text-4xl leading-none">The Áme</div>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="text-xs uppercase tracking-wider opacity-70 mb-2">
                      Страницы
                    </div>
                    <ul className="space-y-2">
                      <li>
                        <Link href="/" onClick={() => setIsMenuOpen(false)} className="hover:opacity-80">
                          Главная
                        </Link>
                      </li>
                      <li>
                        <Link href="/catalog" onClick={() => setIsMenuOpen(false)} className="hover:opacity-80">
                          Каталог
                        </Link>
                      </li>
                      <li>
                        <Link href="/delivery" onClick={() => setIsMenuOpen(false)} className="hover:opacity-80">
                          Доставка
                        </Link>
                      </li>
                      <li>
                        <Link href="/about" onClick={() => setIsMenuOpen(false)} className="hover:opacity-80">
                          О нас
                        </Link>
                      </li>
                      <li>
                        <Link href="/contacts" onClick={() => setIsMenuOpen(false)} className="hover:opacity-80">
                          Контакты
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6 text-sm opacity-85 leading-relaxed">
                  <div>Пластунская 123А, корпус 2, этаж 2, офис 84</div>
                  <div>Пн–Вс с 09:00 до 21:00</div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Справа: телефон + ряд иконок */}
        <div className="ml-auto flex items-center gap-3 md:gap-4 pr-4">
          {/* Телефон (кликабельный) */}
          <a
            href="tel:+79939326095"
            className="text-xs sm:text-sm md:text-base font-medium text-[#819570] whitespace-nowrap"
          >
            +7 993 932-60-95
          </a>

          {/* Все иконки в одном ряду */}
          <div className="flex items-center gap-3">
            {/* WhatsApp */}
            <a
              href="https://wa.me/message/XQDDWGSEL35LP1"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Написать в WhatsApp"
              className={iconLinkClass}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-5 h-5 md:w-6 md:h-6"
                fill="currentColor"
              >
                <path d="M20.52 3.48A11.77 11.77 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.16 1.6 5.97L0 24l6.24-1.63A12 12 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.19-1.24-6.19-3.48-8.52zM12 22a9.9 9.9 0 0 1-5.06-1.39l-.36-.21-3.7.97.99-3.6-.24-.37A9.93 9.93 0 0 1 2 12C2 6.49 6.49 2 12 2c2.66 0 5.17 1.04 7.07 2.93A9.9 9.9 0 0 1 22 12c0 5.51-4.49 10-10 10zm5.13-7.37c-.28-.14-1.63-.8-1.88-.89-.25-.09-.43-.14-.61.14-.18.28-.7.89-.86 1.07-.16.18-.32.2-.6.07-.28-.14-1.19-.44-2.27-1.4-.84-.75-1.4-1.68-1.57-1.96-.16-.28-.02-.43.12-.57.13-.13.28-.32.41-.48.14-.16.18-.27.28-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.02-.22-.53-.44-.45-.61-.46l-.52-.01c-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.29 0 1.35.98 2.65 1.11 2.83.14.18 1.93 2.95 4.67 4.14.65.28 1.16.45 1.55.57.65.21 1.24.18 1.71.11.52-.08 1.63-.67 1.86-1.31.23-.64.23-1.19.16-1.31-.07-.11-.25-.18-.52-.32z" />
              </svg>
            </a>

            {/* Telegram */}
            <a
              href="https://t.me/the_ame_flowers"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Telegram"
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
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/theame.flowers"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className={iconLinkClass}
            >
              <svg
                className="w-5 h-5 md:w-6 md:h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.6}
                viewBox="0 0 24 24"
              >
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>

            {/* Избранное */}
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

            {/* Корзина */}
            <CartIcon />
          </div>
        </div>
      </div>
    </div>
  );
}
