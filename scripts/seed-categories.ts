/**
 * Seed категорий каталога.
 * Заполняет таблицу categories из массива названий (например, скопированного с flowerna.ru).
 *
 * Запуск: npm run seed-categories (из корня nextjs-project)
 * Требуется: .env.local с NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY.
 *
 * Логика:
 * - Для каждого названия генерируется slug (транслитерация RU→EN, lowercase, дефисы).
 * - Если slug уже занят — добавляется суффикс -2, -3 и т.д.
 * - Upsert по slug: повторный запуск не создаёт дубликаты, только обновляет sort_order и is_active.
 */

import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { slugify } from "../src/utils/slugify";

const envPath = resolve(process.cwd(), ".env.local");
config({ path: envPath, override: true });

// -----------------------------------------------------------------------------
// Список названий категорий. Вставьте сюда список с flowerna.ru или свой.
// Порядок в массиве = sort_order (0, 1, 2, ...).
// -----------------------------------------------------------------------------
const CATEGORY_NAMES: string[] = [
  "Авторские букеты",
  "Моно букеты",
  "Композиции в коробке",
  "Вазы",
  // Ниже — примеры с flowerna.ru (раскомментируйте и дополните по желанию):
  "14 февраля",
  "8 марта",
  "Экспресс-доставка",
  "Сейчас сезон",
  "Круглые авторские букеты",
  "Моно, дуо и трио-букеты",
  "Цветы в коробке",
  "Корзины цветов",
  "Вазы",
  "Подарки",
  "Сладости",
  "Открытки",
];

async function ensureUniqueSlug(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  baseSlug: string,
  usedInRun: Set<string>
): Promise<string> {
  let candidate = baseSlug;
  let n = 1;
  for (;;) {
    if (usedInRun.has(candidate)) {
      candidate = `${baseSlug}-${++n}`;
      continue;
    }
    const { data } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", candidate)
      .limit(1)
      .maybeSingle();
    if (!data) {
      usedInRun.add(candidate);
      return candidate;
    }
    candidate = `${baseSlug}-${++n}`;
  }
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error(
      "❌ Задайте NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в .env.local"
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey);
  const usedSlugs = new Set<string>();

  console.log("🌱 Seed категорий. Записей в списке:", CATEGORY_NAMES.length);

  for (let i = 0; i < CATEGORY_NAMES.length; i++) {
    const name = CATEGORY_NAMES[i].trim();
    if (!name) continue;

    const baseSlug = slugify(name) || "category";
    const slug = await ensureUniqueSlug(supabase, baseSlug, usedSlugs);

    const { error } = await supabase.from("categories").upsert(
      {
        name,
        slug,
        sort_order: i,
        is_active: true,
      },
      { onConflict: "slug" }
    );

    if (error) {
      console.error(`  ❌ ${name} (${slug}):`, error.message);
    } else {
      console.log(`  ✓ ${name} → ${slug} (#${i + 1})`);
    }
  }

  console.log("\n✅ Seed завершён.");
}

main();
