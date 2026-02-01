"use client";

import { useState, useEffect, useRef } from "react";
import { TopMarquee } from "./TopMarquee";
import { TopBar } from "./TopBar";
import { HeaderMain } from "./HeaderMain";

const MARQUEE_H = 32;
const DIVIDER_H = 1;
const TOP_BAR_H = 44;
const HEADER_MAIN_H = 44;
const BEIGE_BLOCK_H = DIVIDER_H + TOP_BAR_H + HEADER_MAIN_H;

/** Бежевый блок начинает скрываться только после scrollY > этого значения (нет резкого пропадания с верха) */
const THRESHOLD_TOP_HIDE = 30;
/** Порог дельты скролла (px): анти-дребезг */
const SCROLL_DELTA_THRESHOLD = 3;
/** Длительность анимации transform */
const HEADER_TRANSITION_MS = 150;

/** Фиксированная высота spacer: зелёная + бежевый блок. Не меняется при скрытии — контент не прыгает. */
const SPACER_HEIGHT = MARQUEE_H + BEIGE_BLOCK_H;

type BeigeState = "visible" | "hidden";

/**
 * Скрытие/появление бежевой шапки:
 * - Spacer фиксированной высоты — layout не меняется, контент не скачет.
 * - Скрытие только через transform; бежевый блок не прячется при scrollY <= THRESHOLD_TOP_HIDE.
 * - Вся логика в refs + setState только при смене состояния (без дёрганья и "умирания").
 */
export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [beigeState, setBeigeState] = useState<BeigeState>("visible");

  const prevYRef = useRef(0);
  const lastYRef = useRef(0);
  const visibleRef = useRef(true);
  const tickingRef = useRef(false);

  useEffect(() => {
    const updateFromScroll = () => {
      const lastY = lastYRef.current;
      const prevY = prevYRef.current;
      prevYRef.current = lastY;

      const delta = lastY - prevY;
      let newVisible: boolean;

      if (lastY <= 0) {
        newVisible = true;
      } else if (Math.abs(delta) < SCROLL_DELTA_THRESHOLD) {
        tickingRef.current = false;
        return;
      } else if (delta > 0 && lastY > THRESHOLD_TOP_HIDE) {
        newVisible = false;
      } else if (delta < 0) {
        newVisible = true;
      } else {
        newVisible = true;
      }

      if (newVisible !== visibleRef.current) {
        visibleRef.current = newVisible;
        setBeigeState(newVisible ? "visible" : "hidden");
      }
      tickingRef.current = false;
    };

    const handleScroll = () => {
      if (typeof window === "undefined") return;
      lastYRef.current = window.scrollY;
      if (tickingRef.current) return;
      tickingRef.current = true;
      requestAnimationFrame(updateFromScroll);
    };

    const initialY = typeof window !== "undefined" ? window.scrollY : 0;
    prevYRef.current = initialY;
    lastYRef.current = initialY;
    const initialVisible = initialY <= THRESHOLD_TOP_HIDE;
    visibleRef.current = initialVisible;
    setBeigeState(initialVisible ? "visible" : "hidden");

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const beigeHidden = beigeState === "hidden";

  return (
    <header className="relative z-50">
      {/* Слои: марки 70 (всегда видна над бежевым), бежевый 60. Оверлей/сайдбар меню рендерятся в портал с z 80/85 в HeaderMain. */}
      <div className="fixed left-0 right-0 top-0 z-[70]" style={{ height: MARQUEE_H }}>
        <TopMarquee
          phrases={["Один клик и ты герой 14 февраля"]}
          href="/magazine/14-fevralya"
          speed={50}
          duplicates={6}
        />
      </div>

      {/* Один бежевый контейнер: top = высота зелёной; при HIDDEN уезжает целиком (translateY(-100%)), полоска не остаётся */}
      <div
        className="fixed left-0 right-0 z-[60] bg-header-bg will-change-transform"
        style={{
          top: MARQUEE_H,
          transform: beigeHidden ? "translateY(-100%)" : "translateY(0)",
          pointerEvents: beigeHidden ? "none" : "auto",
          transition: `transform ${HEADER_TRANSITION_MS}ms linear`,
        }}
      >
        <TopBar />
        <HeaderMain isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      </div>

      {/* Spacer фиксированной высоты: layout не меняется при скрытии/появлении шапки */}
      <div className="shrink-0" style={{ height: SPACER_HEIGHT }} aria-hidden />
    </header>
  );
}
