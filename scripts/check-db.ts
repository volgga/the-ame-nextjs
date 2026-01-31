/**
 * Скрипт проверки подключения к Supabase и наличия данных в таблицах с товарами.
 * Запуск: npm run check-db (из корня nextjs-project)
 */
import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const envPath = resolve(process.cwd(), ".env.local");
const loaded = config({ path: envPath, override: true });
if (loaded.error && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.warn("Файл .env.local не найден или не прочитан:", envPath);
}

const TABLES = [
  "products",
  "product_variants",
  "variant_products",
  "orders",
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

  for (const table of TABLES) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });

      if (error) {
        console.log(`  ${table}: ⚠️ ${error.message} (код: ${error.code})`);
        if (error.code === "42P01") {
          console.log(`    → Таблица или view не найдена.`);
        }
        if (error.code === "42501") {
          console.log(`    → Нет прав доступа (RLS или роль).`);
        }
        continue;
      }

      const n = count ?? 0;
      if (n === 0) {
        console.log(`  ${table}: 0 строк (таблица пуста)`);
      } else {
        console.log(`  ${table}: ${n} строк`);
      }
    } catch (e) {
      console.log(`  ${table}: ❌ ${e instanceof Error ? e.message : String(e)}`);
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
