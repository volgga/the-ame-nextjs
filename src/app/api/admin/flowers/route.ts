import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getAllFlowers } from "@/lib/getAllFlowers";

async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) throw new Error("unauthorized");
}

/**
 * GET /api/admin/flowers
 * Возвращает список всех уникальных цветов из товаров каталога.
 * Используется в админке для отображения чекбоксов цветов.
 */
export async function GET() {
  try {
    await requireAdmin();
    const flowers = await getAllFlowers();
    return NextResponse.json(flowers);
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/flowers GET]", e);
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }
}
