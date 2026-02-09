import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { reorderFlowers } from "@/lib/flowers";
import { z } from "zod";

async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) throw new Error("unauthorized");
}

const bodySchema = z.object({
  ordered_ids: z.array(z.string().uuid()),
});

/**
 * POST /api/admin/flowers/reorder
 * Обновление порядка цветов (массив id в нужном порядке).
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Неверные данные", details: parsed.error.flatten() }, { status: 400 });
    }
    const ok = await reorderFlowers(parsed.data.ordered_ids);
    if (!ok) {
      return NextResponse.json({ error: "Ошибка сохранения порядка" }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/flowers/reorder POST]", e);
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}
