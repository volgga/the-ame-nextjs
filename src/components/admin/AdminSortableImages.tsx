"use client";

import { useState } from "react";
import { X } from "lucide-react";

export type SortableImageItem = {
  id: string;
  url: string;
  /** Для новых загруженных файлов (товары/варианты) */
  file?: File;
};

type AdminSortableImagesProps = {
  items: SortableImageItem[];
  onReorder: (items: SortableImageItem[]) => void;
  onRemove: (id: string) => void;
  /** @deprecated Убрано: порядок меняется только через drag-and-drop. Первое фото (индекс 0) — главное. */
  onSetMain?: (id: string) => void;
  /** Показывать подпись «Главное» на первом (для товаров) */
  firstIsMain?: boolean;
  /** Размер превью: 72–96px */
  thumbSize?: number;
  disabled?: boolean;
};

function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const result = [...arr];
  const [removed] = result.splice(from, 1);
  result.splice(to, 0, removed);
  return result;
}

function SortableImageCard({
  item,
  index,
  firstIsMain,
  thumbSize,
  onRemove,
  disabled,
  isDragging,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  item: SortableImageItem;
  index: number;
  firstIsMain?: boolean;
  thumbSize: number;
  onRemove: (id: string) => void;
  disabled?: boolean;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
}) {
  return (
    <div
      draggable={!disabled}
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      className={`
        relative flex-shrink-0 rounded-lg overflow-hidden border-2 bg-[rgba(31,42,31,0.04)]
        cursor-grab active:cursor-grabbing
        ${isDragging ? "z-50 border-color-text-main opacity-90 shadow-lg" : "border-border-block"}
        ${disabled ? "pointer-events-none opacity-60" : ""}
      `}
      style={{ width: thumbSize, height: thumbSize }}
    >
      <div className="w-full h-full">
        <img
          src={item.url}
          alt=""
          className="w-full h-full object-cover block pointer-events-none select-none"
          width={thumbSize}
          height={thumbSize}
          draggable={false}
        />
      </div>
      {firstIsMain && index === 0 && (
        <span className="absolute bottom-0 left-0 right-0 bg-green-600 text-white text-xs text-center py-0.5">
          Главное
        </span>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(item.id);
        }}
        title="Удалить"
        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow"
        aria-label="Удалить"
      >
        <X className="w-3 h-3" strokeWidth={2.5} />
      </button>
    </div>
  );
}

export function AdminSortableImages({
  items,
  onReorder,
  onRemove,
  onSetMain: _onSetMain,
  firstIsMain = false,
  thumbSize = 88,
  disabled = false,
}: AdminSortableImagesProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  function handleDragStart(e: React.DragEvent, index: number) {
    if (disabled) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.setData("application/json", JSON.stringify({ index }));
  }

  function handleDragOver(e: React.DragEvent, dropIndex: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault();
    setDraggedIndex(null);
    if (disabled) return;
    const dragIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (Number.isNaN(dragIndex) || dragIndex === dropIndex) return;
    const reordered = arrayMove(items, dragIndex, dropIndex);
    onReorder(reordered);
  }

  function handleDragEnd() {
    setDraggedIndex(null);
  }

  return (
    <div className="flex flex-wrap gap-3 overflow-x-auto py-1">
      {items.map((item, index) => (
        <SortableImageCard
          key={item.id}
          item={item}
          index={index}
          firstIsMain={firstIsMain}
          thumbSize={thumbSize}
          onRemove={onRemove}
          disabled={disabled}
          isDragging={draggedIndex === index}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
        />
      ))}
    </div>
  );
}
