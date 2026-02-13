import { redirect } from "next/navigation";

/**
 * Раздел "По цветку" / "Цветы в составе" удалён из UI админки.
 * Редирект на список категорий. Данные в БД не трогаем.
 */
export default function AdminFlowersInCompositionPage() {
  redirect("/admin/categories");
}
