import { NextResponse } from "next/server";
import { destroyAdminSession } from "@/lib/adminAuth";

/** Очистка session cookie. Вызывается автоматически при уходе с /admin (не из UI). */
export async function POST() {
  await destroyAdminSession();
  return NextResponse.json({ success: true });
}
