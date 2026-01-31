"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

const BRAND_COLOR = "#819570";
const BORDER_MUTED = "rgba(129, 149, 112, 0.25)";

type Provider = {
  type: string;
  src: string;
  srcModal: string;
  label: string;
  background: string;
  url?: string;
};

type ContactsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  providers: Provider[];
};

/**
 * ContactsModal — модалка с контактами и соцсетями.
 * Закрывается по X, overlay, Esc.
 */
export function ContactsModal({ isOpen, onClose, providers }: ContactsModalProps) {
  // Блокировка скролла страницы при открытой модалке
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Закрытие по Esc
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Overlay — затемняет всё (marquee, шапку, страницу); z выше шапки и корзины */}
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ zIndex: 202 }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Модалка по центру экрана */}
      <div
        className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-[500px] max-h-[90vh] bg-white shadow-2xl rounded-2xl overflow-hidden transform transition-all duration-300 ease-out ${
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        }`}
        style={{ zIndex: 203 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Скроллируемый контент */}
        <div className="overflow-y-auto h-full max-h-[90vh]">
          {/* Шапка: 3 колонки — пусто / заголовок по центру / крестик справа */}
          <div className="grid grid-cols-3 items-center gap-2 pt-4 px-6 sticky top-0 bg-white z-10 pb-2">
            <div className="w-10" aria-hidden />
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-1" style={{ color: BRAND_COLOR }}>
                The Áme
              </h2>
              <p className="text-sm text-muted-foreground">ЦВЕТЫ × ЧУВСТВА</p>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                aria-label="Закрыть"
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:opacity-80 flex-shrink-0"
                style={{ color: BRAND_COLOR }}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Контент модалки */}
          <div className="px-6 pb-6 space-y-6">
            {/* Текст */}
            <div className="text-center space-y-2 text-sm text-foreground">
              <p>
                Ответим Вам в течение 10 минут. Мы на связи с 9:00 до 21:00.
              </p>
              <p>
                Круглосуточная доставка при заказе до 21:00.
              </p>
              <p className="text-muted-foreground italic">
                (Наблюдаются сбои в работе WhatsApp)
              </p>
            </div>

            {/* Кнопки мессенджеров: единый шаблон — слева иконка в подложке, по центру текст */}
            <div className="grid grid-cols-2 gap-3">
              {providers
                .filter((p) => p.type !== "phone")
                .map((provider) => (
                  <a
                    key={provider.type}
                    href={provider.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 h-[76px] min-h-[76px] rounded-xl text-white transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-white/30"
                    style={{
                      backgroundImage: provider.background,
                      backgroundSize: "100% 100%",
                      backgroundColor: "transparent",
                    }}
                  >
                    {/* Левый слот: фиксированная ширина 68px, иконка по центру с подложкой для читаемости */}
                    <div className="w-[68px] min-w-[68px] flex items-center justify-center flex-shrink-0">
                      <span className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center flex-shrink-0">
                        <img
                          src={provider.src}
                          alt={provider.label}
                          className="w-7 h-7 object-contain block"
                        />
                      </span>
                    </div>
                    {/* Название рядом с иконкой */}
                    <div className="flex-1 flex items-center min-w-0 pr-4">
                      <span className="font-semibold text-xl text-white truncate text-left">
                        {provider.label}
                      </span>
                    </div>
                  </a>
                ))}
            </div>

            {/* Разделитель */}
            <div className="border-t" style={{ borderColor: BORDER_MUTED }} />

            {/* Телефон — текст и outline-иконка на белом фоне */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Предпочитаете звонить? Ответим на Ваши вопросы
              </p>
              <a
                href="tel:+79939326095"
                className="inline-flex items-center justify-center gap-2 transition-colors hover:opacity-80"
                style={{ color: BRAND_COLOR }}
              >
                <img
                  src="/icons/phone-outline.svg"
                  alt="Телефон"
                  className="w-5 h-5 flex-shrink-0 object-contain block"
                />
                <span className="text-lg font-semibold">+7 993 932-60-95</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
