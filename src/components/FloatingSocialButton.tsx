"use client";

import { useState, useEffect, useRef } from "react";
import { ContactsModal } from "./ContactsModal";

type ProviderType = "telegram" | "whatsapp" | "instagram" | "max" | "phone";

const providers: Array<{
  type: ProviderType;
  src: string;
  srcModal: string;
  label: string;
  background: string;
  url?: string;
}> = [
  {
    type: "telegram",
    src: "/icons/telegram-white.svg",
    srcModal: "/icons/telegram-white.svg",
    label: "Telegram",
    background: "linear-gradient(135deg, #229ED9, #1C7FC2)",
    url: "https://t.me/the_ame_flowers",
  },
  {
    type: "whatsapp",
    src: "/icons/whatsapp-white.svg",
    srcModal: "/icons/whatsapp.svg",
    label: "WhatsApp",
    background: "linear-gradient(135deg, #25D366, #1EBE5B)",
    url: "https://wa.me/message/XQDDWGSEL35LP1",
  },
  {
    type: "instagram",
    src: "/icons/instagram-white.svg",
    srcModal: "/icons/instagram.svg",
    label: "Instagram",
    background: "linear-gradient(135deg, #F58529, #DD2A7B)",
    url: "https://www.instagram.com/theame.flowers",
  },
  {
    type: "max",
    src: "/icons/max4-messenger-color-icon.png",
    srcModal: "/icons/max4-messenger-color-icon.png",
    label: "MAX",
    background: "linear-gradient(135deg, #2F6BFF, #6A3DF0)",
    url: "https://max.ru/u/f9LHodD0cOJJBRShH_taOp567aS5B7oZt4PZHqOvsl782HDW1tNY1II4OTY",
  },
  {
    type: "phone",
    src: "/icons/phone-white.svg",
    srcModal: "/icons/phone-white.svg",
    label: "Телефон",
    background: "linear-gradient(135deg, #6B7F5E, #C2B59B)",
    url: "tel:+79939326095",
  },
];

const TRANSITION_MS = 1300;
const HOLD_MS = 2000;
const INTERVAL_MS = HOLD_MS + TRANSITION_MS;

export function FloatingSocialButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionPhase, setTransitionPhase] = useState<"start" | "end">("end");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const stateRef = useRef({ currentIndex: 0, isTransitioning: false });

  useEffect(() => {
    stateRef.current.currentIndex = currentIndex;
    stateRef.current.isTransitioning = isTransitioning;
  }, [currentIndex, isTransitioning]);

  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const changeProvider = () => {
      if (stateRef.current.isTransitioning) return;
      const idx = stateRef.current.currentIndex;
      const nextIdx = (idx + 1) % providers.length;
      setPrevIndex(idx);
      setCurrentIndex(nextIdx);
      setIsTransitioning(true);
      setTransitionPhase("start");
    };

    const initialTimer = setTimeout(changeProvider, HOLD_MS);
    intervalRef.current = setInterval(changeProvider, INTERVAL_MS);

    return () => {
      clearTimeout(initialTimer);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // После "start" даём один кадр, затем переключаем фазу для анимации
  useEffect(() => {
    if (!isTransitioning || transitionPhase !== "start") return;
    const rafId = requestAnimationFrame(() => setTransitionPhase("end"));
    return () => cancelAnimationFrame(rafId);
  }, [isTransitioning, transitionPhase]);

  // По окончании анимации сбрасываем isTransitioning
  useEffect(() => {
    if (transitionPhase !== "end" || !isTransitioning) return;
    const t = setTimeout(() => {
      setIsTransitioning(false);
      setPrevIndex(currentIndex);
    }, TRANSITION_MS);
    return () => clearTimeout(t);
  }, [transitionPhase, isTransitioning, currentIndex]);

  const currentProvider = providers[currentIndex];
  const prevProvider = providers[prevIndex];
  const showTwoLayers = isTransitioning && prevIndex !== currentIndex;
  const outOpacity = transitionPhase === "start" ? 1 : 0;
  const inOpacity = transitionPhase === "start" ? 0 : 1;

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`fixed bottom-6 right-6 w-16 h-16 rounded-full flex items-center justify-center shadow-xl z-[150] overflow-hidden ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        } hover:scale-110 hover:shadow-2xl transition-[transform,box-shadow] duration-300`}
        style={{
          backgroundColor: "transparent",
        }}
        aria-label={`Открыть контакты - ${currentProvider.label}`}
      >
        {/* Градиент: статичный, без анимации переливания */}
        {!showTwoLayers ? (
          <span
            className="absolute inset-0 rounded-full"
            style={{
              backgroundImage: currentProvider.background,
              backgroundSize: "100% 100%",
              backgroundColor: "transparent",
            }}
            aria-hidden
          />
        ) : (
          <>
            <span
              className="absolute inset-0 rounded-full floating-icon-transition"
              style={{
                backgroundImage: prevProvider.background,
                backgroundSize: "100% 100%",
                backgroundColor: "transparent",
                opacity: outOpacity,
              }}
              aria-hidden
            />
            <span
              className="absolute inset-0 rounded-full floating-icon-transition"
              style={{
                backgroundImage: currentProvider.background,
                backgroundSize: "100% 100%",
                backgroundColor: "transparent",
                opacity: inOpacity,
              }}
              aria-hidden
            />
          </>
        )}

        {/* Иконки: crossfade prev / next */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {!showTwoLayers ? (
            <img src={currentProvider.src} alt={currentProvider.label} className="w-8 h-8 object-contain block" />
          ) : (
            <>
              <img
                src={prevProvider.src}
                alt=""
                className="absolute w-8 h-8 object-contain block floating-icon-transition"
                style={{
                  opacity: outOpacity,
                  transform: transitionPhase === "start" ? "scale(1)" : "scale(0.92)",
                }}
                aria-hidden
              />
              <img
                src={currentProvider.src}
                alt={currentProvider.label}
                className="absolute w-8 h-8 object-contain block floating-icon-transition"
                style={{
                  opacity: inOpacity,
                  transform: transitionPhase === "start" ? "scale(0.92)" : "scale(1)",
                }}
              />
            </>
          )}
        </div>

        <span
          className="absolute inset-0 rounded-full animate-ping-slow opacity-20 pointer-events-none"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.3)" }}
          aria-hidden
        />
      </button>

      <ContactsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} providers={providers} />
    </>
  );
}
