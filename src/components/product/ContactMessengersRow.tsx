"use client";

import Link from "next/link";
import { contactProviders } from "@/lib/contactProviders";

const MESSENGER_ORDER: ("whatsapp" | "telegram" | "max")[] = ["whatsapp", "telegram", "max"];

const BUTTON_LABELS: Record<string, string> = {
  whatsapp: "WHATSAPP",
  telegram: "TELEGRAM",
  max: "МАХ",
};

export function ContactMessengersRow() {
  const providers = MESSENGER_ORDER
    .map((type) => contactProviders.find((p) => p.type === type))
    .filter((p): p is NonNullable<typeof p> => p != null && p.url != null);

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-2">
      <span className="text-xs font-medium text-color-text-secondary uppercase tracking-wide shrink-0">
        СВЯЗАТЬСЯ С НАМИ:
      </span>
      <div className="flex flex-wrap items-center gap-2">
        {providers.map((p) => (
          <Link
            key={p.type}
            href={p.url!}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={p.label}
            className="inline-flex items-center justify-center h-9 px-4 rounded-full border border-[var(--color-text-main)] text-color-text-main text-xs font-medium uppercase tracking-wide hover:text-color-text-secondary hover:border-[var(--color-text-secondary)] transition-colors bg-transparent"
          >
            {BUTTON_LABELS[p.type] ?? p.label.toUpperCase()}
          </Link>
        ))}
      </div>
    </div>
  );
}
