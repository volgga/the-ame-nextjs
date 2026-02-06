/**
 * Скрипт проверки подключения к Supabase и сверки таблиц с кодом приложения.
 * Запуск: npm run check-db (из корня nextjs-project)
 * Требует .env.local с NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const envPath = resolve(process.cwd(), ".env.local");
const loaded = config({ path: envPath, override: true });
if (loaded.error && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.warn("Файл .env.local не найден или не прочитан:", envPath);
}

/** Таблицы, используемые в приложении (сверка с БД) */
const CORE_TABLES = ["products", "product_variants", "variant_products", "orders", "product_details"] as const;
const HOME_TABLES = ["home_reviews", "hero_slides", "home_collections"] as const;
const REF_TABLES = [
  "categories",
  "add_on_products_categories",
  "delivery_zones",
  "gift_hints",
  "one_click_orders",
] as const;

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error("❌ Ошибка: задайте NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY в .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, key);
  console.log("🔗 Подключение к Supabase:", url);

  function checkTable(table: string): Promise<{ ok: boolean; count: number | null; error?: string }> {
    return supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .then(({ count, error }) => {
        if (error) return { ok: false, count: null, error: `${error.message} (${error.code})` };
        return { ok: true, count: count ?? 0 };
      })
      .catch((e) => ({ ok: false, count: null, error: e instanceof Error ? e.message : String(e) }));
  }

  const groups: { title: string; tables: readonly string[] }[] = [
    { title: "Ядро (товары, заказы, детали)", tables: CORE_TABLES },
    { title: "Главная страница", tables: HOME_TABLES },
    { title: "Справочники и прочее", tables: REF_TABLES },
  ];

  for (const { title, tables } of groups) {
    console.log("\n--- " + title + " ---");
    for (const table of tables) {
      const result = await checkTable(table);
      if (result.ok) {
        const n = result.count!;
        console.log(`  ${table}: ${n} строк${n === 0 ? " (пусто)" : ""}`);
      } else {
        console.log(`  ${table}: ⚠️ ${result.error}`);
        if (result.error?.includes("42P01")) console.log("    → Таблица не найдена. Проверьте миграции.");
        if (result.error?.includes("42501")) console.log("    → Нет прав (RLS/роль).");
      }
    }
  }

  // --- Видимые по правилам UI (те же фильтры, что в коде) ---
  console.log("\n--- Видимые по правилам UI ---");
  try {
    const { count: productsVisible } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .or("is_active.eq.true,is_active.is.null")
      .or("is_hidden.eq.false,is_hidden.is.null");
    console.log("  products (видимые):", productsVisible ?? 0);

    const { count: vpVisible } = await supabase
      .from("variant_products")
      .select("*", { count: "exact", head: true })
      .or("is_active.eq.true,is_active.is.null")
      .or("is_hidden.eq.false,is_hidden.is.null");
    console.log("  variant_products (видимые):", vpVisible ?? 0);
  } catch (e) {
    console.log("  (видимые):", e instanceof Error ? e.message : String(e));
  }

  // --- Примеры slug (5 из products, 5 из variant_products) ---
  console.log("\n--- Примеры slug ---");
  try {
    const { data: pSlugs } = await supabase
      .from("products")
      .select("slug")
      .or("is_active.eq.true,is_active.is.null")
      .or("is_hidden.eq.false,is_hidden.is.null")
      .limit(5);
    console.log("  products:", (pSlugs ?? []).map((r: { slug?: string }) => r.slug).join(", ") || "(нет)");

    const { data: vpSlugs } = await supabase
      .from("variant_products")
      .select("slug")
      .or("is_active.eq.true,is_active.is.null")
      .or("is_hidden.eq.false,is_hidden.is.null")
      .limit(5);
    console.log("  variant_products:", (vpSlugs ?? []).map((r: { slug?: string }) => r.slug).join(", ") || "(нет)");
  } catch (e) {
    console.log("  slugs:", e instanceof Error ? e.message : String(e));
  }

  console.log("\n✅ Проверка завершена.");
}

main();
