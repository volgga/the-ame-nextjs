"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";

export type Category = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  description?: string | null;
};

const iconSize = 16;
const iconClass =
  "shrink-0 rounded p-1 text-gray-600 transition-colors cursor-pointer hover:bg-gray-200 hover:text-gray-800";

type CategoryCardProps = {
  category: Category;
  index: number;
  onEdit: () => void;
  onToggleActive: () => void;
  onDeleteClick: () => void;
  isToggling?: boolean;
};

export function CategoryCard({
  category,
  index,
  onEdit,
  onToggleActive,
  onDeleteClick,
  isToggling = false,
}: CategoryCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        group relative flex flex-col overflow-hidden rounded-xl border border-border-block bg-white hover:border-border-block-hover p-4
        cursor-grab active:cursor-grabbing
        transition-all duration-200 ease-out
        hover:-translate-y-1 hover:shadow-lg
        min-h-[100px]
        ${!category.is_active ? "opacity-85" : ""}
        ${isDragging ? "z-50 scale-[1.02] shadow-xl ring-2 ring-color-text-main/30" : ""}
      `}
    >
      {/* Order badge */}
      <span className="absolute left-2 top-2 z-10 rounded bg-black/60 px-2 py-0.5 text-sm font-medium text-white">
        #{index + 1}
      </span>

      {/* Action icons: top-right */}
      <div
        className="absolute right-2 top-2 z-10 flex items-center gap-0.5 opacity-90 group-hover:opacity-100"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label={category.is_active ? "Скрыть категорию" : "Показать категорию"}
          disabled={isToggling}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleActive();
          }}
          className={`${iconClass} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {category.is_active ? (
            <Eye size={iconSize} strokeWidth={2} />
          ) : (
            <EyeOff size={iconSize} strokeWidth={2} />
          )}
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

      {/* Content: name + status */}
      <div className="flex flex-1 flex-col justify-center pt-6">
        <p className="font-medium text-[#111] text-lg leading-tight">{category.name}</p>
        <p className={`mt-1 text-sm ${category.is_active ? "text-color-text-main" : "text-gray-400"}`}>
          {category.is_active ? "Активна" : "Неактивна"}
        </p>
      </div>
    </div>
  );
}
