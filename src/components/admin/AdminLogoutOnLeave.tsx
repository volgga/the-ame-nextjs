"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function sendLogout() {
  const url = "/api/admin/logout";
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon(url, "");
  } else {
    fetch(url, { method: "POST", keepalive: true }).catch(() => {});
  }
}

/**
 * При переходе с /admin (не login) на любую не-admin страницу отправляет logout.
 * Не срабатывает при обновлении страницы (pathname не меняется на другой сайт).
 */
export function AdminLogoutOnLeave() {
  const pathname = usePathname();
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    const prev = prevPathRef.current;
    prevPathRef.current = pathname;

    if (prev === null) return; // первый рендер — только запомнить

    const wasAdmin = prev.startsWith("/admin") && prev !== "/admin/login";
    const isAdmin = pathname.startsWith("/admin");
    if (wasAdmin && !isAdmin) sendLogout();
  }, [pathname]);

  return null;
}
