"use client";

import { useState, useEffect, useRef } from "react";
import { ContactsModal } from "./ContactsModal";

// Тип провайдера
type ProviderType = "telegram" | "whatsapp" | "instagram" | "max" | "phone";

// Конфигурация провайдеров с брендовыми цветами фона и белыми иконками
const providers: Array<{
  type: ProviderType;
  src: string; // Иконка для плавающего кружка
  srcModal: string; // Иконка для модалки (в сетке)
  label: string;
  background: string; // CSS значение для background
  url?: string; // URL для модалки
}> = [
  {
    type: "telegram",
    src: "/icons/telegram-white.svg",
    srcModal: "/icons/telegram.svg",
    label: "Telegram",
    background: "#229ED9",
    url: "https://t.me/the_ame_flowers",
  },
  {
    type: "whatsapp",
    src: "/icons/whatsapp-white.svg",
    srcModal: "/icons/whatsapp.svg",
    label: "WhatsApp",
    background: "#25D366",
    url: "https://wa.me/message/XQDDWGSEL35LP1",
  },
  {
    type: "instagram",
    src: "/icons/instagram-white.svg",
    srcModal: "/icons/instagram.svg",
    label: "Instagram",
    background: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
    url: "https://www.instagram.com/theame.flowers",
  },
  {
    type: "max",
    src: "/icons/max-messenger-sign-logo.svg",
    srcModal: "/icons/max-messenger-sign-logo.svg",
    label: "MAX",
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    url: "https://max.ru/u/f9LHodD0cOJJBRShH_taOp567aS5B7oZt4PZHqOvsl782HDW1tNY1II4OTY",
  },
  {
    type: "phone",
    src: "/icons/phone-white.svg",
    srcModal: "/icons/phone-white.svg",
    label: "Телефон",
    background: "#819570",
    url: "tel:+79939326095",
  },
];

/**
 * FloatingSocialButton — плавающая кнопка с циклической сменой иконок мессенджеров.
 * Фон кнопки меняется под каждый бренд.
 * При клике открывает модалку с контактами.
 */
export function FloatingSocialButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
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

  // Циклическая смена иконок каждые 3 секунды
  useEffect(() => {
    const changeProvider = () => {
      setIsAnimating(true);
      
      // Задержка перед сменой (fade out)
      const timeout1 = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % providers.length);
        
        // Задержка перед fade in
        const timeout2 = setTimeout(() => {
          setIsAnimating(false);
        }, 50);
        timeoutRefs.current.push(timeout2);
      }, 200);
      timeoutRefs.current.push(timeout1);
    };

    // Первая смена через 3 секунды после монтирования
    const initialTimer = setTimeout(() => {
      changeProvider();
      
      // Затем каждые 3 секунды
      intervalRef.current = setInterval(changeProvider, 3000);
    }, 3000);
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

  const currentProvider = providers[currentIndex];
  const currentLabel = currentProvider.label;

  return (
    <>
      {/* Плавающая кнопка */}
      <button
        onClick={() => setIsModalOpen(true)}
        className={`fixed bottom-6 right-6 w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all duration-500 z-[150] ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        } hover:scale-110 hover:shadow-2xl`}
        style={{
          background: currentProvider.background,
          backgroundSize: currentProvider.background.includes("gradient") ? "100% 100%" : undefined,
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
            src={currentProvider.src}
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
          style={{
            backgroundColor: currentProvider.background.includes("gradient")
              ? "rgba(255, 255, 255, 0.3)"
              : currentProvider.background,
          }}
          aria-hidden="true"
        />
      </button>

      {/* Модалка контактов */}
      <ContactsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        providers={providers}
      />
    </>
  );
}
