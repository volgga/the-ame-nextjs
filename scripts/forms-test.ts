/**
 * Smoke-тест: 3 POST-запроса к локальным API форм (one-click, bouquet, gift-hint).
 * Сервер должен быть запущен: npm run dev
 * Использование: npx tsx scripts/forms-test.ts [baseUrl]
 * По умолчанию baseUrl = http://localhost:3000
 */

const BASE = process.argv[2] ?? "http://localhost:3000";

async function post(path: string, body: object): Promise<{ ok?: boolean; error?: string }> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json() as Promise<{ ok?: boolean; error?: string }>;
}

async function main() {
  console.log("Forms smoke test, base:", BASE);

  const oneClick = await post("/api/forms/one-click", {
    phone: "+79001234567",
    name: "Test",
    productTitle: "Test product",
    pageUrl: "/product/test",
    productPath: "/product/test",
  });
  console.log("one-click:", oneClick.ok ? "OK" : oneClick.error ?? "unknown");

  const bouquet = await post("/api/forms/bouquet", {
    phone: "+79001234568",
    name: "Test",
    pageUrl: "/",
  });
  console.log("bouquet:", bouquet.ok ? "OK" : bouquet.error ?? "unknown");

  const giftHint = await post("/api/forms/gift-hint", {
    phone: "+79001234569",
    name: "Test",
    pageUrl: "/product/test",
    productPath: "/product/test",
  });
  console.log("gift-hint:", giftHint.ok ? "OK" : giftHint.error ?? "unknown");

  if (oneClick.ok && bouquet.ok && giftHint.ok) {
    console.log("All three forms returned ok");
  } else {
    console.error("Some requests failed (rate limit / validation / server down)");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
