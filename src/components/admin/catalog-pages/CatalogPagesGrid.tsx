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
import type { CatalogPage } from "./CatalogPageCard";
import { CatalogPageCard } from "./CatalogPageCard";

type CatalogPagesGridProps = {
  pages: CatalogPage[];
  onReorder: (newOrder: CatalogPage[]) => void;
  onEdit: (page: CatalogPage) => void;
  onToggleActive: (page: CatalogPage) => void;
  onDeleteClick: (page: CatalogPage) => void;
  togglingId?: string | null;
};

export function CatalogPagesGrid({
  pages,
  onReorder,
  onEdit,
  onToggleActive,
  onDeleteClick,
  togglingId = null,
}: CatalogPagesGridProps) {
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

    const oldIndex = pages.findIndex((p) => p.id === active.id);
    const newIndex = pages.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(pages, oldIndex, newIndex);
    const withOrder = reordered.map((p, i) => ({ ...p, sort_order: i }));
    onReorder(withOrder);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={pages.map((p) => p.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {pages.map((page, i) => (
            <CatalogPageCard
              key={page.id}
              page={page}
              index={i}
              onEdit={() => onEdit(page)}
              onToggleActive={() => onToggleActive(page)}
              onDeleteClick={() => onDeleteClick(page)}
              isToggling={togglingId === page.id}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
