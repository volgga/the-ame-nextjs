"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Редирект: настройки «Время доставки» перенесены в раздел «Условия доставки». */
export default function AdminDeliverySchedulePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/delivery-zones");
  }, [router]);
  return (
    <div className="space-y-6">
      <div className="h-7 w-48 animate-pulse rounded bg-gray-200" />
      <div className="h-64 animate-pulse rounded bg-gray-100" />
    </div>
  );
}
