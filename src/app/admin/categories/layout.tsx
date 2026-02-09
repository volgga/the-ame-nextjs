"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    { href: "/admin/categories", label: "Категории", exact: true },
    { href: "/admin/categories/occasions", label: "По поводу", exact: false },
    { href: "/admin/categories/flowers-in-composition", label: "Цветы в составе", exact: false },
  ];

  // Определяем активную вкладку
  const getActiveTab = () => {
    if (pathname === "/admin/categories") return "categories";
    if (pathname.startsWith("/admin/categories/occasions")) return "occasions";
    if (pathname.startsWith("/admin/categories/flowers-in-composition")) return "flowers-in-composition";
    // Для подкатегорий и других страниц - показываем вкладку "Категории" как активную
    if (pathname.startsWith("/admin/categories/")) return "categories";
    return null;
  };

  const activeTab = getActiveTab();

  return (
    <div className="space-y-6">
      {/* Поднавигация */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {tabs.map((tab) => {
            let tabKey = "categories";
            if (tab.href === "/admin/categories/occasions") tabKey = "occasions";
            else if (tab.href === "/admin/categories/flowers-in-composition") tabKey = "flowers-in-composition";
            const isActive = activeTab === tabKey;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${
                  isActive
                    ? "border-color-bg-main text-[#111]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Контент */}
      {children}
    </div>
  );
}
