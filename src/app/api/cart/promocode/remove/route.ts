import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const CART_PROMO_COOKIE = "cart_promo_code";

/**
 * POST /api/cart/promocode/remove
 * Снимает применённый промокод (удаляет cookie).
 */
export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.set(CART_PROMO_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return NextResponse.json({ success: true, discount: 0 });
  } catch (e) {
    console.error("[cart/promocode/remove]", e);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
