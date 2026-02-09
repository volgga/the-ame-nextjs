"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import Image from "next/image";

export type AdminBlogPost = {
  id: string;
  title: string;
  slug: string;
  cover_image_url: string | null;
  published: boolean;
  created_at: string;
  sort_order: number | null;
};

type BlogPostRowProps = {
  post: AdminBlogPost;
  onEdit: () => void;
  onDelete: () => void;
};

export function BlogPostRow({ post, onEdit, onDelete }: BlogPostRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: post.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr ref={setNodeRef} style={style} className={`hover:bg-gray-50 ${isDragging ? "z-50 opacity-90 shadow-xl" : ""}`}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
            aria-label="Перетащить для изменения порядка"
          >
            <GripVertical className="w-5 h-5" />
          </button>
          {post.cover_image_url ? (
            <div className="relative w-16 h-16 rounded overflow-hidden bg-gray-100">
              <Image src={post.cover_image_url} alt={post.title} fill className="object-cover" sizes="64px" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-400">
              Нет фото
            </div>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="font-medium text-gray-900">{post.title}</div>
      </td>
      <td className="px-4 py-3">
        <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">{post.slug}</code>
      </td>
      <td className="px-4 py-3">
        {post.published ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Опубликован
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Черновик
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {new Date(post.created_at).toLocaleDateString("ru-RU", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <button onClick={onEdit} className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
            Редактировать
          </button>
          <button onClick={onDelete} className="text-sm text-red-600 hover:text-red-800 hover:underline">
            Удалить
          </button>
        </div>
      </td>
    </tr>
  );
}
