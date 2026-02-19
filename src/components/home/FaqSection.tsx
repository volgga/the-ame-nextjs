"use client";

import { useState } from "react";
import { MAIN_PAGE_BLOCK_GAP, MAIN_PAGE_BLOCK_GAP_MARGIN } from "@/components/ui/breadcrumbs";
import { ChevronDown } from "lucide-react";
import type { FaqItem } from "@/lib/homeFaq";

type FaqSectionProps = {
  faqItems: FaqItem[];
};

const ANSWER_TRANSITION_MS = 300;

/**
 * Секция "Часто задаваемые вопросы" — аккордеон.
 * Первый вопрос открыт по умолчанию, остальные закрыты.
 * Плавная анимация раскрытия через grid-template-rows: 0fr → 1fr.
 */
export function FaqSection({ faqItems }: FaqSectionProps) {
  const [openId, setOpenId] = useState<string | null>(faqItems[0]?.id ?? null);

  const toggleItem = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  if (!faqItems || faqItems.length === 0) {
    return null;
  }

  return (
    <section className={`bg-page-bg ${MAIN_PAGE_BLOCK_GAP}`} aria-labelledby="faq-heading">
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
            const isLast = index === faqItems.length - 1;

            return (
              <div
                key={item.id}
                className={!isLast ? "border-b border-[var(--color-outline-border)]/30" : ""}
              >
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className="w-full flex items-center justify-between gap-4 pl-0 pr-4 md:pr-5 py-4 md:py-5 text-left hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-outline-border)] focus-visible:ring-offset-2"
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
                  className="grid transition-[grid-template-rows] ease-in-out"
                  style={{
                    gridTemplateRows: isOpen ? "1fr" : "0fr",
                    transitionDuration: `${ANSWER_TRANSITION_MS}ms`,
                  }}
                >
                  <div className="overflow-hidden">
                    <div className="pl-0 pr-4 md:pr-5 pb-4 md:pb-5 text-sm md:text-base text-[var(--color-text-main)] leading-relaxed">
                      {item.answer}
                    </div>
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
