import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";

/** Для удобства клиента: проверить, авторизован ли админ (без 401). */
export async function GET() {
  const authenticated = await isAdminAuthenticated();
  return NextResponse.json({ authenticated });
}
