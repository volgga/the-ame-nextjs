"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  if (isLogin) {
    return <div className="min-h-screen bg-page-bg flex items-center justify-center py-12">{children}</div>;
  }

  const navItems = [
    { href: "/admin/slides", label: "Слайды" },
    { href: "/admin/home", label: "Главная страница" },
    { href: "/admin/products", label: "Товары" },
    { href: "/admin/categories", label: "Категории" },
    { href: "/admin/add-on-products", label: "Доп товары" },
    { href: "/admin/delivery-zones", label: "Условия доставки" },
    { href: "/admin/blog", label: "Блог" },
    { href: "/admin/about", label: "О нас" },
    { href: "/admin/corporate", label: "Корпоративы" },
  ];

  return (
    <div className="min-h-screen bg-page-bg">
      <header className="h-14 sm:h-16 bg-page-bg border-b border-gray-200 flex items-end justify-center relative z-10">
        <nav className="container mx-auto px-4 pb-3">
          <div className="flex items-end justify-center gap-3 sm:gap-6 overflow-x-auto whitespace-nowrap">
            {navItems.map(({ href, label }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={`group relative text-base font-medium transition-colors duration-200 ${
                    isActive ? "text-[#111]" : "text-[#111] hover:text-color-text-main"
                  }`}
                >
                  <span className="relative inline-block pb-0.5">{label}</span>
                  <span
                    className={`absolute bottom-0 left-0 right-0 h-[3px] rounded-full bg-color-bg-main transition-transform duration-300 ease-out origin-left ${
                      isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </Link>
              );
            })}
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-2 text-base font-medium text-[#111] hover:text-color-text-main transition-colors duration-200 min-h-[40px]"
            >
              Выйти
            </button>
          </div>
        </nav>
      </header>
      <main className="container mx-auto px-4 py-6 text-[#111]">{children}</main>
    </div>
  );
}
