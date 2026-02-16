"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";

type CategoryInfoRichEditorProps = {
  value: string;
  onChange: (html: string) => void;
};

export function CategoryInfoRichEditor({ value, onChange }: CategoryInfoRichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "focus:outline-none min-h-[120px] px-3 py-2 border border-gray-300 rounded text-sm text-[#111] prose prose-sm max-w-none [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1",
      },
    },
  });

  if (!editor) {
    return <div className="h-32 animate-pulse rounded-lg bg-gray-200" />;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-lg bg-gray-50">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 text-xs rounded ${
            editor.isActive("heading", { level: 2 }) ? "bg-[#111] text-white" : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-2 py-1 text-xs rounded ${
            editor.isActive("heading", { level: 3 }) ? "bg-[#111] text-white" : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          H3
        </button>
        <div className="w-px bg-gray-300" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 text-xs rounded font-bold ${
            editor.isActive("bold") ? "bg-[#111] text-white" : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 text-xs rounded italic ${
            editor.isActive("italic") ? "bg-[#111] text-white" : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          I
        </button>
        <div className="w-px bg-gray-300" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 text-xs rounded ${
            editor.isActive("bulletList") ? "bg-[#111] text-white" : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          • Список
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-2 py-1 text-xs rounded ${
            editor.isActive("orderedList") ? "bg-[#111] text-white" : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          1. Список
        </button>
        <div className="w-px bg-gray-300" />
        <button
          type="button"
          onClick={() => {
            const url = window.prompt("Введите URL ссылки:");
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          className={`px-2 py-1 text-xs rounded ${
            editor.isActive("link") ? "bg-[#111] text-white" : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          Ссылка
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={!editor.isActive("link")}
          className="px-2 py-1 text-xs rounded bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Убрать ссылку
        </button>
      </div>
      <div className="category-info-editor-content">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
