import { NextResponse } from "next/server";

/**
 * Временный диагностический route: проверка наличия ADMIN_* в env (без вывода хеша).
 * GET /api/admin/debug-env — удалить после отладки.
 */
export async function GET() {
  try {
    const username = process.env.ADMIN_USERNAME ?? null;
    const hash = process.env.ADMIN_PASSWORD_HASH ?? null;

    return NextResponse.json({
      hasUsername: typeof process.env.ADMIN_USERNAME === "string" && process.env.ADMIN_USERNAME.length > 0,
      hasHash: typeof hash === "string" && hash.length > 0,
      username,
      hashLength: typeof hash === "string" ? hash.length : null,
      hashStartsWith2b: typeof hash === "string" && hash.startsWith("$2b$"),
    });
  } catch {
    return NextResponse.json({ error: true }, { status: 500 });
  }
}
