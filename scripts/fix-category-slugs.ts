/**
 * Исправление slug категорий: приводит slug в соответствие с названием (slugify(name)).
 * Пример: name="Вазы", slug="otkrytki" → slug="vazy".
 *
 * Запуск: npm run fix-category-slugs (из корня nextjs-project)
 * Требуется: .env.local с NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY.
 */

import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { slugify } from "../src/utils/slugify";

const envPath = resolve(process.cwd(), ".env.local");
config({ path: envPath, override: true });

type Row = { id: string; name: string; slug: string };

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error("❌ Задайте NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey);

  const { data: rows, error: fetchError } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("sort_order", { ascending: true });

  if (fetchError) {
    console.error("❌ Ошибка загрузки категорий:", fetchError.message);
    process.exit(1);
  }

  const categories = (rows ?? []) as Row[];
  const usedSlugs = new Set(categories.map((c) => (c.slug ?? "").trim()).filter(Boolean));

  const changes: { id: string; name: string; oldSlug: string; newSlug: string }[] = [];

  for (const cat of categories) {
    const name = (cat.name ?? "").trim();
    const oldSlug = (cat.slug ?? "").trim();
    const expectedSlug = slugify(name) || "category";

    if (oldSlug === expectedSlug) continue;

    usedSlugs.delete(oldSlug);

    let newSlug = expectedSlug;
    let n = 1;
    while (usedSlugs.has(newSlug)) {
      newSlug = `${expectedSlug}-${++n}`;
    }
    usedSlugs.add(newSlug);

    const { error: updateError } = await supabase
      .from("categories")
      .update({ slug: newSlug })
      .eq("id", cat.id);

    if (updateError) {
      console.error(`❌ ${cat.id} (${cat.name}):`, updateError.message);
      usedSlugs.add(oldSlug);
      usedSlugs.delete(newSlug);
    } else {
      changes.push({ id: cat.id, name: cat.name ?? "", oldSlug, newSlug });
    }
  }

  if (changes.length === 0) {
    console.log("Все slug уже соответствуют названиям. Изменений нет.");
    return;
  }

  console.log("Изменённые категории:\n");
  console.log("ID                                   | name                    | oldSlug -> newSlug");
  console.log("-".repeat(85));
  for (const c of changes) {
    console.log(`${c.id} | ${c.name.padEnd(23).slice(0, 23)} | ${c.oldSlug} -> ${c.newSlug}`);
  }
  console.log("\n✅ Готово. Обновлено записей:", changes.length);
}

main();
