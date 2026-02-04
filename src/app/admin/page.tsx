import { redirect } from "next/navigation";

/**
 * При переходе в админ-панель сразу открываем раздел «Слайды».
 * Редирект по URL /admin выполняется также в middleware.
 */
export default function AdminPage() {
  redirect("/admin/slides");
}
