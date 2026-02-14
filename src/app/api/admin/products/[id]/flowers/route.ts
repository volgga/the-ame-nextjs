import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { getFlowers, getFlowersByNames, getProductFlowerIds, setProductFlowers } from "@/lib/flowers";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VP_PREFIX = "vp-";

function parseProductId(id: string): { productIdForDb: string } | null {
  if (UUID_REGEX.test(id)) return { productIdForDb: id };
  if (id.startsWith(VP_PREFIX)) {
    const n = id.slice(VP_PREFIX.length);
    if (n && !Number.isNaN(parseInt(n, 10))) return { productIdForDb: n };
  }
  if (!Number.isNaN(parseInt(id, 10))) return { productIdForDb: id };
  return null;
}

async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) throw new Error("unauthorized");
}

/**
 * GET /api/admin/products/[id]/flowers
 * Возвращает привязанные цветы (id и имена) для товара.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const parsed = parseProductId(id);
    if (!parsed) return NextResponse.json({ error: "Неверный ID" }, { status: 400 });

    const flowerIds = await getProductFlowerIds(id);
    const allFlowers = await getFlowers(false);
    const idToName = new Map(allFlowers.map((f) => [f.id, f.name]));
    const flower_names = flowerIds.map((fid) => idToName.get(fid) ?? "").filter(Boolean);

    return NextResponse.json({ flower_ids: flowerIds, flower_names });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/products flowers GET]", e);
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/products/[id]/flowers
 * Обновляет привязки товара к цветам (product_flowers) и composition_flowers.
 * Поддерживает body.flower_ids (массив id) или body.flower_names (массив имён — только существующие в whitelist).
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const parsed = parseProductId(id);
    if (!parsed) return NextResponse.json({ error: "Неверный ID" }, { status: 400 });

    const body = await request.json();
    const flower_names_param = Array.isArray(body.flower_names)
      ? body.flower_names.filter((x: unknown) => typeof x === "string" && (x as string).trim())
      : null;

    let flower_ids: string[];
    let flower_names: string[];

    if (flower_names_param != null && flower_names_param.length >= 0) {
      const resolved = await getFlowersByNames(flower_names_param);
      flower_ids = resolved.map((f) => f.id);
      flower_names = resolved.map((f) => f.name);
    } else {
      const ids = Array.isArray(body.flower_ids) ? body.flower_ids.filter((x: unknown) => typeof x === "string") : [];
      const allFlowers = await getFlowers(false);
      const idToName = new Map(allFlowers.map((f) => [f.id, f.name]));
      flower_ids = ids;
      flower_names = ids.map((fid: string) => idToName.get(fid) ?? "").filter(Boolean);
    }

    const ok = await setProductFlowers(id, flower_ids, flower_names);
    if (!ok) return NextResponse.json({ error: "Ошибка сохранения" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e) {
    if ((e as Error).message === "unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    console.error("[admin/products flowers PUT]", e);
    return NextResponse.json({ error: "Ошибка обновления" }, { status: 500 });
  }
}
