"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/**
 * Редактирование товара открывается модалкой на странице списка.
 * Прямая ссылка /admin/products/[id] перенаправляет на /admin/products?edit=id.
 */
export default function AdminProductEditRedirect() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    if (id) {
      router.replace(`/admin/products?edit=${encodeURIComponent(id)}`);
    }
  }, [id, router]);

  return (
    <div className="p-8 text-color-text-secondary">
      Перенаправление на редактирование…
    </div>
  );
}
