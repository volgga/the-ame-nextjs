"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, EyeOff, GripVertical, Pencil, Trash2 } from "lucide-react";

export type AdminProduct = {
  id: string;
  type: "simple" | "variant";
  name: string;
  slug: string;
  price: number;
  image_url?: string | null;
  is_active: boolean;
  is_hidden: boolean;
  is_preorder?: boolean;
  sort_order?: number;
};

const iconSize = 16;
const iconClass =
  "shrink-0 rounded p-1 text-gray-600 transition-colors cursor-pointer hover:bg-gray-200 hover:text-gray-800";

type ProductRowCardProps = {
  product: AdminProduct;
  index: number;
  onEdit: () => void;
  onToggleHidden: () => void;
  onDeleteClick: () => void;
  isToggling?: boolean;
};

export function ProductRowCard({
  product,
  index,
  onEdit,
  onToggleHidden,
  onDeleteClick,
  isToggling = false,
}: ProductRowCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const typeLabel = product.type === "simple" ? "Простой" : "Вариант";
  const priceTypeLine = product.is_preorder
    ? `Предзаказ · ${typeLabel}`
    : `${product.price?.toLocaleString("ru-RU") ?? 0} ₽ · ${typeLabel}`;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group relative flex items-center gap-2.5 w-full rounded-xl border border-border-block bg-white px-3 py-3
        hover:border-border-block-hover
        ${isDragging ? "z-50 opacity-90 shadow-xl ring-2 ring-color-text-main/30" : ""}
        ${product.is_hidden ? "opacity-85" : ""}
      `}
    >
      {/* Drag handle — только отсюда начинается перетаскивание */}
      <div
        {...attributes}
        {...listeners}
        className="flex shrink-0 cursor-grab active:cursor-grabbing touch-none p-1 text-color-text-secondary hover:text-color-text-main rounded hover:bg-[rgba(31,42,31,0.06)]"
        title="Перетащить"
        aria-label="Перетащить для изменения порядка"
      >
        <GripVertical className="h-5 w-5" strokeWidth={2} />
      </div>

      {/* Миниатюра */}
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[rgba(31,42,31,0.08)]">
        {product.image_url ? (
          <img src={product.image_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full" />
        )}
      </div>

      {/* Action icons: top-right (как в CategoryCard) */}
      <div
        className="absolute right-2 top-2 z-10 flex items-center gap-0.5 opacity-90 group-hover:opacity-100"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label={product.is_hidden ? "Показать товар" : "Скрыть товар"}
          disabled={isToggling}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleHidden();
          }}
          className={`${iconClass} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {product.is_hidden ? <EyeOff size={iconSize} strokeWidth={2} /> : <Eye size={iconSize} strokeWidth={2} />}
        </button>
        <button
          type="button"
          aria-label="Редактировать"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit();
          }}
          className={iconClass}
        >
          <Pencil size={iconSize} strokeWidth={2} />
        </button>
        <button
          type="button"
          aria-label="Удалить"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDeleteClick();
          }}
          className={iconClass}
        >
          <Trash2 size={iconSize} strokeWidth={2} />
        </button>
      </div>

      {/* Правая часть: #N, цена·тип */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1 pr-20">
        <div className="flex items-center gap-1.5">
          <span className="rounded bg-[rgba(31,42,31,0.08)] px-2 py-0.5 text-xs font-medium text-color-text-main shrink-0">
            #{index + 1}
          </span>
        </div>
        <p className="text-xs text-color-text-secondary leading-tight truncate" title={priceTypeLine}>
          {priceTypeLine}
        </p>
      </div>
    </div>
  );
}
