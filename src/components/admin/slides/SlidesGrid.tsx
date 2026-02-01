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
import { SortableContext, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import type { Slide } from "./SlideCard";
import { SlideCard } from "./SlideCard";

type SlidesGridProps = {
  slides: Slide[];
  onReorder: (newOrder: Slide[]) => void;
  onEdit: (slide: Slide) => void;
};

export function SlidesGrid({ slides, onReorder, onEdit }: SlidesGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = slides.findIndex((s) => s.id === active.id);
    const newIndex = slides.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(slides, oldIndex, newIndex);
    // Update sort_order to match new positions (0-based)
    const withOrder = reordered.map((s, i) => ({ ...s, sort_order: i }));
    onReorder(withOrder);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={slides.map((s) => s.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {slides.map((slide, i) => (
            <SlideCard key={slide.id} slide={slide} index={i} onEdit={() => onEdit(slide)} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
