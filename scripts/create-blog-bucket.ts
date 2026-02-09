/**
 * Скрипт для автоматического создания bucket "blog" в Supabase Storage
 * Запуск: npm run create-blog-bucket (или tsx scripts/create-blog-bucket.ts)
 * Требует: NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в .env.local
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

async function createBlogBucket() {
  console.log("🔗 Подключение к Supabase:", url);
  console.log("📦 Создание bucket 'blog'...\n");

  try {
    // Проверяем, существует ли bucket
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error("❌ Ошибка при проверке bucket:", listError.message);
      throw listError;
    }

    const blogBucket = buckets?.find((b) => b.id === "blog");
    if (blogBucket) {
      console.log("✅ Bucket 'blog' уже существует!");
      console.log(`   ID: ${blogBucket.id}`);
      console.log(`   Public: ${blogBucket.public}`);
      console.log(`   Created: ${blogBucket.created_at}`);
      console.log("\n💡 Bucket готов к использованию!");
      console.log("   Если загрузка не работает, выполните SQL миграцию для политик:");
      console.log("   scripts/migrations/blog-storage-bucket.sql");
      return;
    }

    // Создаем bucket через SQL через Supabase REST API
    const sql = `
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      VALUES (
        'blog',
        'blog',
        true,
        26214400,
        ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
      )
      ON CONFLICT (id) DO UPDATE SET
        public = EXCLUDED.public,
        file_size_limit = EXCLUDED.file_size_limit,
        allowed_mime_types = EXCLUDED.allowed_mime_types;
    `;

    const sqlResponse = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
      body: JSON.stringify({ sql }),
    }).catch(async () => {
      // Если RPC не работает, пробуем через прямой SQL endpoint
      return fetch(`${url}/rest/v1/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
        body: sql,
      });
    });

    // Альтернатива: используем прямой SQL через PostgREST
    // Но лучше использовать Management API или выполнить SQL вручную
    console.log("💡 Создание bucket через SQL...");
    
    // Если SQL API не работает, используем альтернативный метод
    try {
      // Пробуем создать через прямой SQL запрос
      const { error: sqlError } = await supabase.rpc('exec_sql', { sql }).catch(() => {
        // Если RPC не существует, пробуем другой способ
        return { error: { message: 'RPC not available' } };
      });

      if (sqlError && !sqlError.message.includes('not available')) {
        throw sqlError;
      }
    } catch (sqlError) {
      // Если SQL через RPC не работает, создаем через Management API
      console.log("⚠️  SQL через RPC недоступен, пробуем Management API...");
      
      const mgmtResponse = await fetch(`${url}/storage/v1/bucket`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
        body: JSON.stringify({
          id: "blog",
          name: "blog",
          public: true,
          file_size_limit: 26214400,
          allowed_mime_types: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/avif", "image/gif"],
        }),
      });

      if (!mgmtResponse.ok) {
        const errorData = await mgmtResponse.json().catch(() => ({ message: mgmtResponse.statusText }));
        throw new Error(errorData.message || `HTTP ${mgmtResponse.status}`);
      }

      const bucketData = await mgmtResponse.json();
      console.log("✅ Bucket 'blog' успешно создан через Management API!");
      console.log(`   ID: ${bucketData.id}`);
      console.log(`   Public: ${bucketData.public}`);
      console.log("\n📝 Теперь можно загружать обложки статей в админке!");
      return;
    }

    // Проверяем, что bucket создан
    const { data: bucketsAfter, error: checkError } = await supabase.storage.listBuckets();
    if (checkError) {
      throw checkError;
    }

    const createdBucket = bucketsAfter?.find((b) => b.id === "blog");
    if (!createdBucket) {
      throw new Error("Bucket не был создан. Выполните SQL миграцию вручную.");
    }

    console.log("✅ Bucket 'blog' успешно создан!");
    console.log(`   ID: ${createdBucket.id}`);
    console.log(`   Public: ${createdBucket.public}`);
    console.log("\n📝 Теперь можно загружать обложки статей в админке!");
  } catch (error) {
    console.error("\n❌ Ошибка при создании bucket:");
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
      
      // Если bucket уже существует (конфликт)
      if (error.message.includes("already exists") || error.message.includes("duplicate")) {
        console.log("\n✅ Bucket уже существует, всё в порядке!");
        return;
      }
      
      // Если метод не поддерживается, предлагаем SQL альтернативу
      if (error.message.includes("405") || error.message.includes("Method not allowed")) {
        console.log("\n💡 REST API не поддерживает создание bucket.");
        console.log("   Выполните SQL миграцию вручную:");
        console.log("   scripts/migrations/blog-storage-bucket.sql");
        console.log("\n   Или создайте bucket через Supabase Dashboard:");
        console.log("   Storage → New bucket → Name: 'blog' → Public: Yes");
        return;
      }
    } else {
      console.error(`   ${String(error)}`);
    }
    process.exit(1);
  }
}

createBlogBucket()
  .then(() => {
    console.log("\n✨ Готово!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Критическая ошибка:", error);
    process.exit(1);
  });
