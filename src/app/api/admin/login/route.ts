import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCredentials, createAdminSession } from "@/lib/adminAuth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const login = typeof body.login === "string" ? body.login.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!login || !password) {
      return NextResponse.json({ error: "Неверный запрос" }, { status: 400 });
    }
    const ok = await verifyAdminCredentials(login, password);
    if (!ok) {
      return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
    }
    await createAdminSession();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
