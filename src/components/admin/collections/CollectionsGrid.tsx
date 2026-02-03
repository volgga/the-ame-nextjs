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
import type { Collection } from "./CollectionCard";
import { CollectionCard } from "./CollectionCard";

type CollectionsGridProps = {
  collections: Collection[];
  onReorder: (newOrder: Collection[]) => void;
  onEdit: (collection: Collection) => void;
};

export function CollectionsGrid({ collections, onReorder, onEdit }: CollectionsGridProps) {
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

    const oldIndex = collections.findIndex((c) => c.id === active.id);
    const newIndex = collections.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(collections, oldIndex, newIndex);
    const withOrder = reordered.map((c, i) => ({ ...c, sort_order: i }));
    onReorder(withOrder);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={collections.map((c) => c.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {collections.map((col, i) => (
            <CollectionCard key={col.id} collection={col} index={i} onEdit={() => onEdit(col)} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
