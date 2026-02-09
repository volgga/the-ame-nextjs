"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";

type BlogRichEditorProps = {
  value: string;
  onChange: (html: string) => void;
  postId?: string;
};

export function BlogRichEditor({ value, onChange, postId }: BlogRichEditorProps) {
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
        class: "focus:outline-none min-h-[300px] px-4 py-2 border border-gray-300 rounded-lg",
      },
    },
  });

  if (!editor) {
    return <div className="h-96 animate-pulse rounded-lg bg-gray-200" />;
  }

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-lg bg-gray-50">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-3 py-1 text-sm rounded ${
            editor.isActive("heading", { level: 2 })
              ? "bg-color-bg-main text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-3 py-1 text-sm rounded ${
            editor.isActive("heading", { level: 3 })
              ? "bg-color-bg-main text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          H3
        </button>
        <div className="w-px bg-gray-300" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1 text-sm rounded ${
            editor.isActive("bold") ? "bg-color-bg-main text-white" : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1 text-sm rounded font-semibold italic ${
            editor.isActive("italic") ? "bg-color-bg-main text-white" : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          К
        </button>
        <div className="w-px bg-gray-300" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-1 text-sm rounded ${
            editor.isActive("bulletList") ? "bg-color-bg-main text-white" : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          • Список
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-3 py-1 text-sm rounded ${
            editor.isActive("orderedList") ? "bg-color-bg-main text-white" : "bg-white text-gray-700 hover:bg-gray-100"
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
          className={`px-3 py-1 text-sm rounded ${
            editor.isActive("link") ? "bg-color-bg-main text-white" : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          🔗 Ссылка
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={!editor.isActive("link")}
          className="px-3 py-1 text-sm rounded bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Убрать ссылку
        </button>
      </div>

      {/* Editor */}
      <div className="blog-editor-content">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
