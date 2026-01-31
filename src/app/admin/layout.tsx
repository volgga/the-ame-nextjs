"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  if (isLogin) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center py-12">
        {children}
      </div>
    );
  }

  const navItems = [
    { href: "/admin", label: "Главная" },
    { href: "/admin/slides", label: "Слайды" },
    { href: "/admin/products", label: "Товары" },
    { href: "/admin/categories", label: "Категории" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <nav className="container mx-auto flex items-center justify-center gap-8">
          {navItems.map(({ href, label }) => {
            const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`text-base font-medium transition-colors ${
                  isActive
                    ? "text-[#111] border-b-2 border-[#2E7D32] pb-1 -mb-px"
                    : "text-[#111] hover:text-[#2E7D32]"
                }`}
              >
                {label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={handleLogout}
            className="text-base font-medium text-[#111] hover:text-[#2E7D32] transition-colors"
          >
            Выйти
          </button>
        </nav>
      </header>
      <main className="container mx-auto px-4 py-6 text-[#111]">{children}</main>
    </div>
  );
}
