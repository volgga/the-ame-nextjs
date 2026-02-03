import Link from "next/link";

/**
 * Раздел «Главная страница» в админке.
 * Подразделы: Коллекции The Áme.
 */
export default function AdminHomePage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-[#111]">Главная страница</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/home/collections"
          className="block rounded-xl border border-border-block bg-white hover:border-border-block-hover p-6 shadow-sm hover:shadow transition"
        >
          <h3 className="font-medium text-[#111]">Коллекции The Áme</h3>
          <p className="mt-1 text-sm text-gray-500">Карточки блока «КОЛЛЕКЦИИ THE ÁME» на главной</p>
        </Link>
      </div>
    </div>
  );
}
