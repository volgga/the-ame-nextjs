/**
 * Скрипт для применения политик доступа для bucket "blog"
 * Выполняет SQL миграцию через Supabase Management API
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

async function applyPolicies() {
  console.log("🔧 Применение политик доступа для bucket 'blog'...\n");

  try {
    // Читаем SQL миграцию (только политики, без создания bucket)
    const sql = `
-- Политики доступа для bucket blog
DROP POLICY IF EXISTS "blog_public_read" ON storage.objects;
CREATE POLICY "blog_public_read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'blog');

DROP POLICY IF EXISTS "blog_service_insert" ON storage.objects;
CREATE POLICY "blog_service_insert"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'blog');

DROP POLICY IF EXISTS "blog_service_update" ON storage.objects;
CREATE POLICY "blog_service_update"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'blog');

DROP POLICY IF EXISTS "blog_service_delete" ON storage.objects;
CREATE POLICY "blog_service_delete"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'blog');
`;

    // Пробуем выполнить через Supabase Management API
    // Используем прямой SQL endpoint через PostgREST
    const response = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        "Content-Profile": "service_role",
      },
      body: JSON.stringify({ query: sql }),
    }).catch(() => null);

    if (response && response.ok) {
      console.log("✅ Политики доступа успешно применены!");
      console.log("\n✨ Bucket 'blog' полностью настроен и готов к использованию!");
      return;
    }

    // Если автоматическое выполнение не работает, используем альтернативный метод
    console.log("⚠️  Автоматическое выполнение SQL через REST API недоступно.");
    console.log("💡 Выполните SQL миграцию вручную через Supabase Dashboard:\n");
    console.log("   1. Откройте Supabase Dashboard → SQL Editor");
    console.log("   2. Скопируйте содержимое файла:");
    console.log("      scripts/migrations/blog-storage-bucket.sql");
    console.log("   3. Вставьте в SQL Editor и нажмите Run\n");
    
    // Показываем SQL для копирования
    console.log("📋 SQL для копирования:\n");
    console.log(sql);
    console.log("\n✨ После выполнения SQL bucket будет полностью настроен!");
  } catch (error) {
    console.error("❌ Ошибка:", error instanceof Error ? error.message : String(error));
    console.log("\n💡 Выполните SQL миграцию вручную:");
    console.log("   scripts/migrations/blog-storage-bucket.sql");
    process.exit(1);
  }
}

applyPolicies();
