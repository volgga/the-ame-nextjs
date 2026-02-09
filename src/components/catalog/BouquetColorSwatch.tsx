"use client";

import type { BouquetColorItem } from "@/shared/catalog/bouquetColors";

const SWATCH_SIZE = "w-[20px] h-[20px]"; // ~18–22px

type BouquetColorSwatchProps = {
  item: BouquetColorItem;
  className?: string;
};

/**
 * Кружок цвета для фильтра и админки.
 * Для «Белый» — серый border; для «Разноцветный» — conic-gradient.
 */
export function BouquetColorSwatch({ item, className = "" }: BouquetColorSwatchProps) {
  const base = `rounded-full shrink-0 ${SWATCH_SIZE} ${className}`;

  if (item.swatch.type === "rainbow") {
    return (
      <span
        className={`${base} block border border-[rgba(31,42,31,0.2)]`}
        style={{
          background: `conic-gradient(from 0deg, #e40303, #ff8c00, #ffed00, #008026, #24408e, #732982, #e40303)`,
        }}
        aria-hidden
      />
    );
  }

  const isWhite = item.swatch.color.toLowerCase() === "#ffffff" || item.swatch.color === "white";
  return (
    <span
      className={`${base} block ${isWhite ? "border border-[rgba(31,42,31,0.25)]" : ""}`}
      style={{ backgroundColor: item.swatch.color }}
      aria-hidden
    />
  );
}
