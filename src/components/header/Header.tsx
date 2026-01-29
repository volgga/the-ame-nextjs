"use client";

import { TopMarquee } from "./TopMarquee";
import { HeaderMain } from "./HeaderMain";
import { CategoryNav } from "./CategoryNav";

/**
 * Header — собирает все 3 уровня шапки:
 * 1. TopMarquee (бегущая строка)
 * 2. HeaderMain (верхняя плашка с меню/телефоном/иконками)
 * 3. CategoryNav (категории-чипсы с логотипом)
 */
export function Header() {
  return (
    <header className="relative z-50">
      {/* 1) Бегущая строка */}
      <div className="fixed inset-x-0 top-0 z-[60]">
        <TopMarquee
          phrases={["Гарантия 3 дня", "Цветочный консьерж", "Доставка за 45 минут"]}
          href="/catalog"
          speed={50}
          duplicates={6}
        />
      </div>

      {/* 2) Верхняя плашка */}
      <HeaderMain />

      {/* 3) Спейсер (36px для marquee + 48px для header main) */}
      <div className="h-[84px]" />

      {/* 4) Бренд-плашка с категориями */}
      <CategoryNav />
    </header>
  );
}
