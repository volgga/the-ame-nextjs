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
    { href: "/admin", label: "Главная" },
    { href: "/admin/slides", label: "Слайды" },
    { href: "/admin/home", label: "Главная страница" },
    { href: "/admin/products", label: "Товары" },
    { href: "/admin/categories", label: "Категории" },
  ];

  return (
    <div className="min-h-screen bg-page-bg">
      <header className="h-14 sm:h-16 bg-page-bg border-b border-gray-200 flex items-end justify-center">
        <nav className="container mx-auto flex items-end justify-center gap-6 sm:gap-8 px-4 pb-3">
          {navItems.map(({ href, label }) => {
            const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`relative text-base font-medium transition-colors duration-200 ${
                  isActive ? "text-[#111]" : "text-[#111] hover:text-color-text-main"
                }`}
              >
                <span className="relative inline-block pb-0.5">{label}</span>
                {isActive && (
                  <span
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] min-w-[1em] max-w-full rounded-full bg-color-bg-main transition-all duration-300"
                    style={{ width: "calc(100% + 4px)" }}
                  />
                )}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={handleLogout}
            className="text-base font-medium text-[#111] hover:text-color-text-main transition-colors duration-200 pb-0.5"
          >
            Выйти
          </button>
        </nav>
      </header>
      <main className="container mx-auto px-4 py-6 text-[#111]">{children}</main>
    </div>
  );
}
