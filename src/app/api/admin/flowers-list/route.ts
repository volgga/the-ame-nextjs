import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getFlowersForCatalog } from "@/lib/flowers";

async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) throw new Error("unauthorized");
}

/**
 * GET /api/admin/flowers-list
 * Список цветов для админки (name, slug). Источник — справочник flowers.
 * @deprecated Предпочтительно использовать GET /api/admin/flowers для полных данных.
 */
export async function GET() {
  try {
    await requireAdmin();
    const flowers = await getFlowersForCatalog();
    const list = flowers.map((f) => ({ name: f.name, slug: f.slug }));
    return NextResponse.json(list);
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/flowers-list GET]", e);
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }
}
