import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { syncFlowersFromProducts } from "@/lib/flowers";

async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) throw new Error("unauthorized");
}

/**
 * POST /api/admin/flowers/sync
 * Синхронизация справочника flowers из товаров (upsert по slug/name, не затирает SEO).
 */
export async function POST() {
  try {
    await requireAdmin();
    const result = await syncFlowersFromProducts();
    return NextResponse.json(result);
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/flowers/sync POST]", e);
    return NextResponse.json({ error: "Ошибка синхронизации" }, { status: 500 });
  }
}
