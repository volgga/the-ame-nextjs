"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * При переходе на новую страницу прокручивает окно в самый верх.
 */
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}
