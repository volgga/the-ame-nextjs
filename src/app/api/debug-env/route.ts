import { NextResponse } from "next/server";

/**
 * Диагностика ENV в рантайме (PM2 и т.д.).
 * GET /api/debug-env — выводит публичные переменные и факт наличия приватных (без значений).
 * Удалить после отладки.
 */
export async function GET() {
  return NextResponse.json({
    siteUrl: process.env.SITE_URL ?? null,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    nodeEnv: process.env.NODE_ENV ?? null,
  });
}
