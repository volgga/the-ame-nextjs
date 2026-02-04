"use client";

import { useState } from "react";
import { MAIN_PAGE_BLOCK_GAP, MAIN_PAGE_BLOCK_GAP_MARGIN } from "@/components/ui/breadcrumbs";
import { ChevronDown } from "lucide-react";
import type { FaqItem } from "@/lib/homeFaq";

type FaqSectionProps = {
  faqItems: FaqItem[];
};

/**
 * Секция "Часто задаваемые вопросы" — аккордеон.
 * По умолчанию все вопросы закрыты, открываются по клику.
 */
export function FaqSection({ faqItems }: FaqSectionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggleItem = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  if (!faqItems || faqItems.length === 0) {
    return null;
  }

  return (
    <section
      className={`bg-page-bg ${MAIN_PAGE_BLOCK_GAP}`}
      aria-labelledby="faq-heading"
    >
      <div className="container mx-auto px-4 md:px-6">
        {/* Разделительная линия над секцией */}
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
        <div className="space-y-3 md:space-y-4">
          {faqItems.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div
                key={item.id}
                className="border border-[var(--color-outline-border)] rounded-xl bg-white overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className="w-full flex items-center justify-between gap-4 p-4 md:p-5 text-left hover:bg-[rgba(31,42,31,0.02)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-outline-border)] focus-visible:ring-offset-2"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${item.id}`}
                >
                  <span className="font-semibold text-[var(--color-text-main)] text-sm md:text-base pr-4">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 flex-shrink-0 text-[var(--color-text-main)] transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {isOpen && (
                  <div
                    id={`faq-answer-${item.id}`}
                    className="px-4 md:px-5 pb-4 md:pb-5 text-sm md:text-base text-[var(--color-text-main)] leading-relaxed"
                  >
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
