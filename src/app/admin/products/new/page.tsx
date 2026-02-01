import { redirect } from "next/navigation";

/**
 * Раньше здесь была страница создания товара.
 * Создание теперь в модальном окне на странице списка товаров.
 * Редирект открывает список и автоматически открывает модалку.
 */
export default function AdminProductsNewPage() {
  redirect("/admin/products?create=1");
}
