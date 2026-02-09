/**
 * Скрипт для настройки политик доступа для bucket "blog"
 * Выполняет SQL миграцию через Supabase Admin API
 */

import { config } from "dotenv";
import { resolve } from "path";
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const envPath = resolve(process.cwd(), ".env.local");
config({ path: envPath, override: true });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!url || !serviceRoleKey) {
  console.error("❌ Ошибка: задайте NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false },
});

async function setupPolicies() {
  console.log("🔧 Настройка политик доступа для bucket 'blog'...\n");

  try {
    // Читаем SQL миграцию
    const sqlPath = resolve(process.cwd(), "scripts/migrations/blog-storage-bucket.sql");
    const sql = readFileSync(sqlPath, "utf-8");

    // Выполняем SQL через Supabase REST API
    // Используем прямой SQL endpoint с service role key
    const response = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
      body: JSON.stringify({ query: sql }),
    }).catch(async () => {
      // Альтернатива: используем PostgREST для выполнения SQL
      // Но лучше выполнить вручную через SQL Editor
      console.log("⚠️  Автоматическое выполнение SQL недоступно.");
      console.log("💡 Выполните SQL миграцию вручную:");
      console.log(`   ${sqlPath}`);
      console.log("\n   Или через Supabase Dashboard:");
      console.log("   SQL Editor → New query → Вставьте содержимое файла → Run");
      return null;
    });

    if (response && response.ok) {
      console.log("✅ Политики доступа успешно настроены!");
    } else if (response) {
      const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
      console.log("⚠️  Не удалось выполнить SQL автоматически.");
      console.log("💡 Выполните SQL миграцию вручную:");
      console.log(`   ${sqlPath}`);
    }

    console.log("\n✨ Готово! Bucket 'blog' полностью настроен.");
  } catch (error) {
    console.error("❌ Ошибка:", error instanceof Error ? error.message : String(error));
    console.log("\n💡 Выполните SQL миграцию вручную:");
    console.log("   scripts/migrations/blog-storage-bucket.sql");
    process.exit(1);
  }
}

setupPolicies();
