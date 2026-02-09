import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { ensureFlowers } from "@/lib/flowers";
import { z } from "zod";

async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) throw new Error("unauthorized");
}

const bodySchema = z.object({
  names: z.array(z.string()),
});

/**
 * POST /api/admin/flowers/ensure
 * Убедиться, что цветы с указанными именами есть в справочнике; вернуть их (для получения id при сохранении товара).
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Неверные данные", details: parsed.error.flatten() }, { status: 400 });
    }
    const flowers = await ensureFlowers(parsed.data.names);
    return NextResponse.json(flowers);
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/flowers/ensure POST]", e);
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}
