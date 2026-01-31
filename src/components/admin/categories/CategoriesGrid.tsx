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
import type { Category } from "./CategoryCard";
import { CategoryCard } from "./CategoryCard";

type CategoriesGridProps = {
  categories: Category[];
  onReorder: (newOrder: Category[]) => void;
  onEdit: (category: Category) => void;
  onToggleActive: (category: Category) => void;
  onDeleteClick: (category: Category) => void;
  togglingId?: string | null;
};

export function CategoriesGrid({
  categories,
  onReorder,
  onEdit,
  onToggleActive,
  onDeleteClick,
  togglingId = null,
}: CategoriesGridProps) {
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

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(categories, oldIndex, newIndex);
    const withOrder = reordered.map((c, i) => ({ ...c, sort_order: i }));
    onReorder(withOrder);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={categories.map((c) => c.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {categories.map((category, i) => (
            <CategoryCard
              key={category.id}
              category={category}
              index={i}
              onEdit={() => onEdit(category)}
              onToggleActive={() => onToggleActive(category)}
              onDeleteClick={() => onDeleteClick(category)}
              isToggling={togglingId === category.id}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
