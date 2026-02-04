"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin } from "lucide-react";
import { SendMessageModal } from "@/components/SendMessageModal";

const iconLinkClass = "relative inline-flex items-center justify-center text-header-foreground";

/** Фиксированный клик/бокс для каждой иконки — стоят ровно, без скачков */
const ICON_BOX = "w-8 h-8 flex items-center justify-center shrink-0";
/** Размер самой иконки (svg/img) */
const ICON_SIZE = "w-5 h-5";

const POPOVER_CLOSE_DELAY_MS = 150;

/** Вертикальная полоска между адресом | телефоном | соцсети. Единая высота и выравнивание (self-center в flex). */
function DividerVertical() {
  return (
    <span
      className="inline-block h-5 w-px shrink-0 mx-2 self-center bg-header-foreground"
      style={{ minWidth: 1 }}
      aria-hidden
    />
  );
}

/**
 * TopBar — инфо-полоса: текст слева, адрес | телефон (с hover-поповером) | иконки справа.
 */
export function TopBar() {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isContactsModalOpen, setIsContactsModalOpen] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsTouch(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  const handlePopoverOpen = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsPopoverOpen(true);
  };

  const handlePopoverClose = () => {
    closeTimeoutRef.current = setTimeout(() => setIsPopoverOpen(false), POPOVER_CLOSE_DELAY_MS);
  };

  const handleOpenContactsModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPopoverOpen(false);
    setIsContactsModalOpen(true);
  };

  useEffect(() => {
    if (!isPopoverOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isPopoverOpen]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  return (
    <>
      <div
        className="w-full flex items-center justify-between bg-header-bg"
        style={{
          margin: 0,
          padding: 0,
          paddingTop: "6px",
          paddingBottom: "6px",
          boxSizing: "border-box",
          lineHeight: "normal",
          height: "100%",
          minHeight: "44px",
          display: "flex",
          overflow: "visible",
        }}
      >
        <div className="w-full flex items-center justify-between px-4 md:px-6">
          {/* Слева: 2 строки текста */}
          <div className="min-w-0 -ml-1 md:-ml-0.5 leading-tight">
            <div className="text-[11px] md:text-xs text-header-foreground-secondary tracking-wide">
              Приём заказов с 09.00 до 21.00
            </div>
            <div className="text-[11px] md:text-xs text-header-foreground-secondary tracking-wide">
              Доставка 24/7 по Сочи и районам
            </div>
          </div>

          {/* Справа: [адрес |] телефон | иконки */}
          <div ref={containerRef} className="flex items-center gap-0 shrink-0">
            {/* Адрес — отдельная ссылка на Яндекс.Карты, без popover, скрыт на узких экранах */}
            <a
              href="https://yandex.ru/maps/239/sochi/?from=mapframe&ll=39.732810%2C43.615391&mode=poi&poi%5Buri%5D=ymapsbm1%3A%2F%2Forg%3Foid%3D77269998905&source=mapframe&utm_source=mapframe&z=19"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 shrink-0 text-sm font-normal text-header-foreground hover:opacity-80 transition-opacity"
              aria-label="Адрес на карте"
            >
              <MapPin
                className="w-4 h-4 shrink-0"
                strokeWidth={2}
                stroke="currentColor"
                fill="none"
                aria-hidden
              />
              <span className="whitespace-nowrap">Пластунская 123А, к2</span>
            </a>

            {/* Разделитель между адресом и телефоном — тот же DividerVertical, flex+items-center как у родителя */}
            <div className="hidden md:flex md:items-center">
              <DividerVertical />
            </div>

            {/* Телефон — hover-область только для popover (не включает адрес) */}
            <div
              className="relative flex items-center"
              onMouseEnter={!isTouch ? handlePopoverOpen : undefined}
              onMouseLeave={!isTouch ? handlePopoverClose : undefined}
            >
              <a
                href="tel:+79939326095"
                className="text-sm md:text-base font-normal text-header-foreground whitespace-nowrap py-1"
              >
                +7 993 932-60-95
              </a>

              {/* Поповер с кнопкой "ЗАКАЗАТЬ ЗВОНОК" — внутри PhoneWrapper, чтобы не исчезал при переходе на popover */}
              {isPopoverOpen && !isTouch && (
                <div
                  className="absolute right-0 top-full z-[75] mt-1.5 min-w-[180px] rounded-xl shadow-lg border border-border-block overflow-hidden bg-page-bg"
                  role="menu"
                  aria-label="Заказать звонок"
                >
                  <div className="p-2">
                    <button
                      type="button"
                      onClick={handleOpenContactsModal}
                      className="w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-bg-main focus-visible:ring-offset-2 bg-header-bg text-header-foreground hover:opacity-90 active:opacity-95"
                    >
                      Заказать звонок
                    </button>
                  </div>
                </div>
              )}
            </div>

            <DividerVertical />

            <a
              href="https://wa.me/message/XQDDWGSEL35LP1"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className={`${iconLinkClass} ${ICON_BOX}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className={`${ICON_SIZE} block text-header-foreground`}
                fill="currentColor"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
            </a>
            <a
              href="https://t.me/the_ame_flowers"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Telegram"
              className={`${iconLinkClass} ${ICON_BOX}`}
            >
              <svg className={`${ICON_SIZE} block text-header-foreground shrink-0`} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161l-1.89 8.905c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.12l-6.87 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
              </svg>
            </a>
            <a
              href="https://max.ru/u/f9LHodD0cOJJBRShH_taOp567aS5B7oZt4PZHqOvsl782HDW1tNY1II4OTY"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Max"
              title="Max"
              className={`${iconLinkClass} ${ICON_BOX}`}
            >
              <span
                className={`${ICON_SIZE} block shrink-0 bg-header-foreground`}
                style={{
                  WebkitMaskImage: "url(/icons/max4-messenger-color-icon.png)",
                  WebkitMaskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskImage: "url(/icons/max4-messenger-color-icon.png)",
                  maskSize: "contain",
                  maskRepeat: "no-repeat",
                  maskPosition: "center",
                }}
              />
            </a>
          </div>
        </div>
      </div>

      <SendMessageModal
        isOpen={isContactsModalOpen}
        onClose={() => setIsContactsModalOpen(false)}
      />
    </>
  );
}
