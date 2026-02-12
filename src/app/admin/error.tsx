"use client";

import { useEffect } from "react";

/**
 * Error boundary для раздела админки.
 * Перехватывает client-side исключения (например при навигации в «Главная» → подкатегория)
 * и показывает fallback UI вместо белого экрана.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Admin Error Boundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12">
      <h2 className="text-xl font-semibold text-[#111]">Ошибка при загрузке раздела</h2>
      <p className="mt-2 max-w-md text-center text-sm text-gray-600">
        {typeof error?.message === "string" ? error.message : "Произошла непредвиденная ошибка."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-lg bg-accent-btn px-6 py-2.5 text-white hover:bg-accent-btn-hover active:bg-accent-btn-active"
      >
        Попробовать снова
      </button>
      <a
        href="/admin/slides"
        className="mt-3 text-sm text-color-text-main underline hover:no-underline"
      >
        Вернуться в слайды
      </a>
    </div>
  );
}
