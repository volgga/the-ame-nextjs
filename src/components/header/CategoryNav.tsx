"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { catalogCategories } from "@/lib/categories";

/**
 * CategoryNav — категории-чипсы (овальные кнопки).
 * Пока используем статический список категорий.
 * Позже подключим данные из Supabase.
 */
function CategoryNavContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const active = searchParams.get("category");
  const isCatalogActive = pathname === "/catalog" && !active;

  // Категории из единого источника (lib/categories.ts)
  const categories = [
    { name: "Каталог", slug: null, isCatalog: true },
    ...catalogCategories.map((c) => ({ name: c.name, slug: c.slug, isCatalog: false })),
  ];

  const base =
    "rounded-full border transition-colors px-4 sm:px-5 py-1.5 text-xs sm:text-sm";
  const inactive =
    "text-[#819570] bg-[#fff4e0] hover:bg-white border-transparent";
  const activeCls = "text-[#819570] bg-white border-[#819570]";

  return (
    <div className="relative overflow-hidden bg-[#ffe9c3] pb-[calc(env(safe-area-inset-bottom)+14px)] md:pb-0">
      {/* Декоративные цветы (пока скрыты, можно добавить позже) */}
      {/* <img src="/branding/flower-left.png" alt="" className="hidden md:block absolute left-3 top-1 h-32 lg:h-40 z-0" /> */}
      {/* <img src="/branding/flower-right.png" alt="" className="hidden md:block absolute right-3 top-1 h-32 lg:h-40 z-0" /> */}

      {/* Инфо-блок справа (десктоп) */}
      <div className="hidden md:block absolute top-5 right-6 z-20 text-[#819570] text-[13px] lg:text-sm leading-snug tracking-wide text-right">
        <div className="font-medium">Режим работы: с 09:00 до 21:00</div>
        <div>Доставка букетов ~45 минут</div>
      </div>

      {/* Контент */}
      <div className="relative z-10 container mx-auto px-4 md:px-10 lg:px-16 xl:px-24">
        <div className="pt-6 pb-6 md:pt-8 md:pb-5">
          {/* Логотип */}
          <div className="text-center" style={{ fontFamily: "Forum, serif" }}>
            <Link href="/" className="block">
              <span className="text-[#819570] tracking-wide leading-[0.9] text-6xl md:text-8xl lg:text-9xl">
                The Áme
              </span>
            </Link>
          </div>

          {/* Категории */}
          <nav className="mt-5 md:mt-6 pb-6">
            <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3.5">
              {categories.map((cat) => {
                if (cat.isCatalog) {
                  return (
                    <Link
                      key="catalog"
                      href="/catalog"
                      className={`${base} ${isCatalogActive ? activeCls : inactive}`}
                      aria-label="Перейти в каталог"
                    >
                      {cat.name}
                    </Link>
                  );
                }

                const href = `/catalog?category=${cat.slug}`;
                const isActive = active === cat.slug;

                return (
                  <Link
                    key={cat.slug}
                    href={href}
                    className={`${base} ${isActive ? activeCls : inactive}`}
                    aria-label={`Категория ${cat.name}`}
                  >
                    {cat.name}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Мобильная версия инфо-блока */}
          <div className="md:hidden mt-0 text-[#819570] text-sm leading-snug tracking-wide text-center">
            <div>Режим работы: с 09:00 до 21:00</div>
            <div>Доставка букетов ~45 минут</div>
          </div>
        </div>
      </div>

      {/* Выемка/полукруг снизу */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 z-10 w-screen">
        <div className="h-[14px] md:h-[16px] bg-[#fff8ea] rounded-t-[24px]" />
      </div>
    </div>
  );
}

export function CategoryNav() {
  return (
    <Suspense fallback={<div className="h-[200px] bg-[#ffe9c3]" />}>
      <CategoryNavContent />
    </Suspense>
  );
}
