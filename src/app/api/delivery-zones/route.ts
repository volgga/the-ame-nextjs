import { NextResponse } from "next/server";
import { getDeliveryZones } from "@/lib/deliveryZones";

/** Публичный API зон доставки для корзины и др. Без кэша — актуальные данные из админки. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const zones = await getDeliveryZones();
    return NextResponse.json(zones, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (e) {
    console.error("[api/delivery-zones GET]", e);
    return NextResponse.json([], { status: 200 });
  }
}
