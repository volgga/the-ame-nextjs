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
import type { AdminProduct } from "./ProductRowCard";
import { ProductRowCard } from "./ProductRowCard";

type ProductsListProps = {
  products: AdminProduct[];
  onReorder: (newOrder: AdminProduct[]) => void;
  onEdit: (product: AdminProduct) => void;
  onToggleHidden: (product: AdminProduct) => void;
  onDeleteClick: (product: AdminProduct) => void;
  togglingId?: string | null;
};

export function ProductsList({
  products,
  onReorder,
  onEdit,
  onToggleHidden,
  onDeleteClick,
  togglingId = null,
}: ProductsListProps) {
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

    const oldIndex = products.findIndex((p) => p.id === active.id);
    const newIndex = products.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(products, oldIndex, newIndex);
    const withOrder = reordered.map((p, i) => ({ ...p, sort_order: i }));
    onReorder(withOrder);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={products.map((p) => p.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product, index) => (
            <ProductRowCard
              key={product.id}
              product={product}
              index={index}
              onEdit={() => onEdit(product)}
              onToggleHidden={() => onToggleHidden(product)}
              onDeleteClick={() => onDeleteClick(product)}
              isToggling={togglingId === product.id}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
