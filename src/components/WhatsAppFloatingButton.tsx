"use client";

import { useState, useEffect, useRef } from "react";
import { ContactsModal } from "./ContactsModal";

// Тип иконки
type IconType = "whatsapp" | "telegram" | "instagram" | "max" | "phone";

// Конфигурация иконок
const icons: Array<{
  type: IconType;
  src: string;
  label: string;
}> = [
  { type: "whatsapp", src: "/icons/whatsapp.svg", label: "WhatsApp" },
  { type: "telegram", src: "/icons/telegram.svg", label: "Telegram" },
  { type: "instagram", src: "/icons/instagram.svg", label: "Instagram" },
  { type: "max", src: "/icons/max.svg", label: "Max" },
  { type: "phone", src: "/icons/phone.svg", label: "Телефон" },
];

/**
 * WhatsAppFloatingButton — плавающая кнопка с циклической сменой иконок мессенджеров.
 * При клике открывает модалку с контактами.
 */
export function WhatsAppFloatingButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [currentIconIndex, setCurrentIconIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  // Плавное появление кнопки после загрузки страницы
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Циклическая смена иконок каждые 2.5 секунды
  useEffect(() => {
    const changeIcon = () => {
      setIsAnimating(true);
      
      // Задержка перед сменой иконки (fade out)
      const timeout1 = setTimeout(() => {
        setCurrentIconIndex((prev) => (prev + 1) % icons.length);
        
        // Задержка перед fade in
        const timeout2 = setTimeout(() => {
          setIsAnimating(false);
        }, 50);
        timeoutRefs.current.push(timeout2);
      }, 200);
      timeoutRefs.current.push(timeout1);
    };

    // Первая смена через 2.5 секунды после монтирования
    const initialTimer = setTimeout(() => {
      changeIcon();
      
      // Затем каждые 2.5 секунды
      intervalRef.current = setInterval(changeIcon, 2500);
    }, 2500);
    timeoutRefs.current.push(initialTimer);

    return () => {
      // Очистка всех таймеров
      timeoutRefs.current.forEach((timer) => clearTimeout(timer));
      timeoutRefs.current = [];
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const currentIcon = icons[currentIconIndex];
  const currentLabel = currentIcon.label;

  return (
    <>
      {/* Плавающая кнопка */}
      <button
        onClick={() => setIsModalOpen(true)}
        className={`fixed bottom-6 right-6 w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 z-[150] animate-gradient-shift ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        } hover:scale-110 hover:shadow-2xl`}
        style={{
          background: "linear-gradient(135deg, hsl(100, 25%, 55%) 0%, hsl(100, 30%, 45%) 50%, hsl(100, 25%, 55%) 100%)",
          backgroundSize: "200% 200%",
        }}
        aria-label={`Открыть контакты - ${currentLabel}`}
      >
        {/* Иконка с анимацией fade/scale */}
        <div
          className={`transition-all duration-300 flex items-center justify-center ${
            isAnimating ? "opacity-0 scale-75" : "opacity-100 scale-100"
          }`}
        >
          <img
            src={currentIcon.src}
            alt={currentLabel}
            className="w-8 h-8"
            style={{
              objectFit: "contain",
              display: "block",
            }}
          />
        </div>
        
        {/* Пульсирующий эффект (раз в несколько секунд) */}
        <span
          className="absolute inset-0 rounded-full animate-ping-slow opacity-20 pointer-events-none"
          style={{ backgroundColor: "hsl(100, 25%, 55%)" }}
          aria-hidden="true"
        />
      </button>

      {/* Модалка контактов */}
      <ContactsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
