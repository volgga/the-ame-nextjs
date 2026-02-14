"use client";

import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  /** Показывать подпись «Главное» на первом (для товаров) */
  firstIsMain?: boolean;
  /** Размер превью: 72–96px */
  thumbSize?: number;
  disabled?: boolean;
};

function SortableImageCard({
  item,
  index,
  firstIsMain,
  thumbSize,
  onRemove,
  disabled,
}: {
  item: SortableImageItem;
  index: number;
  firstIsMain?: boolean;
  thumbSize: number;
  onRemove: (id: string) => void;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: thumbSize,
    height: thumbSize,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        relative flex-shrink-0 rounded-lg overflow-hidden border-2 bg-[rgba(31,42,31,0.04)]
        cursor-grab active:cursor-grabbing
        ${isDragging ? "z-50 border-color-text-main opacity-90 shadow-lg" : "border-border-block"}
        ${disabled ? "pointer-events-none opacity-60" : ""}
      `}
    >
      <img
        src={item.url}
        alt=""
        className="w-full h-full object-cover block"
        width={thumbSize}
        height={thumbSize}
        draggable={false}
      />
      {firstIsMain && index === 0 && (
        <span className="absolute bottom-0 left-0 right-0 bg-accent-btn text-white text-xs text-center py-0.5">
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
  firstIsMain = false,
  thumbSize = 88,
  disabled = false,
}: AdminSortableImagesProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor)
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(items, oldIndex, newIndex);
    onReorder(reordered);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={horizontalListSortingStrategy}>
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
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
