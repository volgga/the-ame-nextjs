/**
 * Скрипт для проверки bucket "blog" и создания политик доступа
 */

import { config } from "dotenv";
import { resolve } from "path";
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

async function verifyBucket() {
  console.log("🔍 Проверка bucket 'blog'...\n");

  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error("❌ Ошибка:", error.message);
      process.exit(1);
    }

    const blogBucket = buckets?.find((b) => b.id === "blog");
    
    if (blogBucket) {
      console.log("✅ Bucket 'blog' существует!");
      console.log(`   ID: ${blogBucket.id}`);
      console.log(`   Public: ${blogBucket.public}`);
      console.log(`   Created: ${blogBucket.created_at}`);
      console.log("\n💡 Bucket готов к использованию!");
      console.log("   Если загрузка не работает, выполните SQL миграцию для политик:");
      console.log("   scripts/migrations/blog-storage-bucket.sql");
    } else {
      console.log("❌ Bucket 'blog' не найден!");
      console.log("\n💡 Выполните SQL миграцию:");
      console.log("   scripts/migrations/blog-storage-bucket.sql");
      console.log("\n   Или создайте bucket через Supabase Dashboard:");
      console.log("   Storage → New bucket → Name: 'blog' → Public: Yes");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Ошибка:", error);
    process.exit(1);
  }
}

verifyBucket();
