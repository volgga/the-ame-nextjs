"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Pencil } from "lucide-react";

export type Slide = {
  id: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
};

type SlideCardProps = {
  slide: Slide;
  index: number;
  onEdit: () => void;
};

export function SlideCard({ slide, index, onEdit }: SlideCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id });

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
        group relative flex flex-col overflow-hidden rounded-xl border border-border-block bg-white hover:border-border-block-hover
        cursor-grab active:cursor-grabbing
        transition-all duration-200 ease-out
        hover:-translate-y-1 hover:shadow-lg
        ${isDragging ? "z-50 scale-[1.02] shadow-xl ring-2 ring-color-text-main/30" : ""}
      `}
    >
      {/* Order badge */}
      <span className="absolute left-2 top-2 z-10 rounded bg-black/60 px-2 py-0.5 text-sm font-medium text-white">
        #{index + 1}
      </span>

      {/* Image container - 16:9 aspect ratio */}
      <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
        {slide.image_url ? (
          <>
            <img
              src={slide.image_url}
              alt={`Слайд ${index + 1}`}
              className="h-full w-full object-cover"
            />
            {/* Dark overlay on hover */}
            <div
              className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/40"
              aria-hidden
            />
            {/* Edit button on hover - overlay blocks drag when visible so Edit is clickable */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto">
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="flex items-center gap-2 rounded-lg border border-white/80 bg-white/90 px-4 py-2 text-sm font-medium text-[#111] shadow-lg transition hover:bg-white"
              >
                <Pencil className="h-4 w-4" />
                Редактировать
              </button>
            </div>
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            Нет изображения
          </div>
        )}
      </div>
    </div>
  );
}
