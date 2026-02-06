"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MAIN_PAGE_BLOCK_GAP, MAIN_PAGE_BLOCK_GAP_MARGIN } from "@/components/ui/breadcrumbs";
import { ChevronDown } from "lucide-react";
import type { FaqItem } from "@/lib/homeFaq";

type FaqSectionProps = {
  faqItems: FaqItem[];
};

const ANSWER_TRANSITION_MS = 320;
const REVEAL_STAGGER_MS = 100;
const REVEAL_DURATION_MS = 480;

/**
 * Секция "Часто задаваемые вопросы" — аккордеон.
 * Первый вопрос открыт по умолчанию, остальные закрыты.
 * Плавная анимация открытия/закрытия по height + opacity + transform.
 * Появление при скролле (stagger) через IntersectionObserver.
 */
export function FaqSection({ faqItems }: FaqSectionProps) {
  const [openId, setOpenId] = useState<string | null>(faqItems[0]?.id ?? null);
  const [revealed, setRevealed] = useState(false);
  const [openContentHeight, setOpenContentHeight] = useState<number | "auto">(0);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [closingHeight, setClosingHeight] = useState(0);

  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const toggleItem = useCallback(
    (id: string) => {
      if (openId === id) {
        const contentEl = contentRef.current;
        const h = contentEl ? contentEl.scrollHeight : 0;
        setClosingId(id);
        setClosingHeight(h);
        setOpenId(null);
        setOpenContentHeight(0);
        requestAnimationFrame(() => {
          setClosingHeight(0);
        });
      } else {
        setClosingId(null);
        setOpenId(id);
        setOpenContentHeight(0);
      }
    },
    [openId]
  );

  useEffect(() => {
    if (!openId) return;
    const id = requestAnimationFrame(() => {
      const h = contentRef.current?.scrollHeight ?? 0;
      setOpenContentHeight(h);
    });
    return () => cancelAnimationFrame(id);
  }, [openId]);

  const handleAnswerTransitionEnd = useCallback(
    (e: React.TransitionEvent, itemId: string) => {
      if (e.propertyName !== "height") return;
      if (openId === itemId) {
        setOpenContentHeight("auto");
      }
      if (closingId === itemId) {
        setClosingId(null);
      }
    },
    [openId, closingId]
  );

  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !revealed) setRevealed(true);
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [revealed]);

  if (!faqItems || faqItems.length === 0) {
    return null;
  }

  return (
    <section
      ref={sectionRef}
      className={`bg-page-bg ${MAIN_PAGE_BLOCK_GAP}`}
      aria-labelledby="faq-heading"
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex justify-center mb-6 md:mb-8">
          <div className="w-full max-w-5xl section-divider-line" aria-hidden />
        </div>
        <div className={MAIN_PAGE_BLOCK_GAP_MARGIN}>
          <h2
            id="faq-heading"
            className="text-2xl md:text-3xl font-bold text-[var(--color-text-main)] uppercase tracking-tight"
          >
            Часто задаваемые вопросы
          </h2>
        </div>
        <div className="space-y-0">
          {faqItems.map((item, index) => {
            const isOpen = openId === item.id;
            const isClosing = closingId === item.id;
            const showContent = isOpen || isClosing;
            const isLast = index === faqItems.length - 1;

            let answerHeight: number | string = 0;
            if (isOpen) answerHeight = openContentHeight;
            else if (isClosing) answerHeight = closingHeight;

            return (
              <div
                key={item.id}
                className={`transition-[opacity,transform] duration-[480ms] ease-out ${
                  !isLast ? "border-b border-[var(--color-outline-border)]/30" : ""
                } ${revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[10px]"}`}
                style={{
                  transitionDelay: revealed ? `${index * REVEAL_STAGGER_MS}ms` : "0ms",
                  transitionProperty: "opacity, transform",
                  transitionDuration: `${REVEAL_DURATION_MS}ms`,
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className="w-full flex items-center justify-between gap-4 p-4 md:p-5 text-left hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-outline-border)] focus-visible:ring-offset-2"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${item.id}`}
                >
                  <span className="font-semibold text-[var(--color-text-main)] text-sm md:text-base pr-4">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 flex-shrink-0 text-[var(--color-text-main)] transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>
                <div
                  id={`faq-answer-${item.id}`}
                  className="overflow-hidden ease-in-out"
                  style={{
                    height: showContent ? (typeof answerHeight === "number" ? `${answerHeight}px` : answerHeight) : "0px",
                    transition: `height ${ANSWER_TRANSITION_MS}ms ease, opacity ${ANSWER_TRANSITION_MS - 80}ms ease, transform ${ANSWER_TRANSITION_MS}ms ease`,
                    opacity:
                      showContent &&
                      ((isOpen && (openContentHeight === "auto" || (typeof openContentHeight === "number" && openContentHeight > 0))) ||
                        (isClosing && closingHeight > 0))
                        ? 1
                        : 0,
                    transform:
                      showContent &&
                      ((isOpen && (openContentHeight === "auto" || (typeof openContentHeight === "number" && openContentHeight > 0))) ||
                        (isClosing && closingHeight > 0))
                        ? "translateY(0)"
                        : "translateY(-4px)",
                  }}
                  onTransitionEnd={(e) => handleAnswerTransitionEnd(e, item.id)}
                >
                  <div
                    ref={showContent ? contentRef : undefined}
                    className="px-4 md:px-5 pb-4 md:pb-5 text-sm md:text-base text-[var(--color-text-main)] leading-relaxed"
                  >
                    {item.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
