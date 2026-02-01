import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-[#111]">Панель управления</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/slides"
          className="block rounded-xl border border-border-block bg-white hover:border-border-block-hover p-6 shadow-sm hover:shadow transition"
        >
          <h3 className="font-medium text-[#111]">Слайды</h3>
          <p className="mt-1 text-sm text-gray-500">
            Управление hero-слайдами на главной
          </p>
        </Link>
        <Link
          href="/admin/products"
          className="block rounded-xl border border-border-block bg-white hover:border-border-block-hover p-6 shadow-sm hover:shadow transition"
        >
          <h3 className="font-medium text-[#111]">Товары</h3>
          <p className="mt-1 text-sm text-gray-500">
            Товары и варианты
          </p>
        </Link>
        <Link
          href="/admin/categories"
          className="block rounded-xl border border-border-block bg-white hover:border-border-block-hover p-6 shadow-sm hover:shadow transition"
        >
          <h3 className="font-medium text-[#111]">Категории</h3>
          <p className="mt-1 text-sm text-gray-500">
            Категории каталога
          </p>
        </Link>
      </div>
    </div>
  );
}
