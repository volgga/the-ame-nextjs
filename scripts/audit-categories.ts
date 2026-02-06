/**
 * Аудит раздела "Категории": данные БД, slug, связи с товарами.
 * — Проверка и исправление name/slug
 * — Поиск битых связей (товары с несуществующим category_slug)
 *
 * Запуск: npm run audit-categories (из корня nextjs-project)
 * Требуется: .env.local с NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY.
 */

import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { slugify } from "../src/utils/slugify";

const envPath = resolve(process.cwd(), ".env.local");
config({ path: envPath, override: true });

type CategoryRow = { id: string; name: string | null; slug: string | null; sort_order: number };

const report = {
  categoriesTotal: 0,
  slugFixed: 0,
  nameTrimmed: 0,
  slugConflictsResolved: 0,
  bugs: [] as string[],
  slugChanges: [] as { id: string; name: string; oldSlug: string; newSlug: string }[],
  brokenProductLinks: [] as { source: string; id: string; name: string; slug: string }[],
};

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error("❌ Задайте NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey);

  // ——— 1) Категории ———
  const { data: catRows, error: catErr } = await supabase
    .from("categories")
    .select("id, name, slug, sort_order")
    .order("sort_order", { ascending: true });

  if (catErr) {
    console.error("❌ Ошибка загрузки категорий:", catErr.message);
    process.exit(1);
  }

  const categories = (catRows ?? []) as CategoryRow[];
  report.categoriesTotal = categories.length;

  const nameLowerToId = new Map<string, string>();
  for (const c of categories) {
    const name = (c.name ?? "").trim();
    if (!name) {
      report.bugs.push(`БД: категория id=${c.id} с пустым name`);
    }
    const lower = name.toLowerCase();
    if (nameLowerToId.has(lower) && nameLowerToId.get(lower) !== c.id) {
      report.bugs.push(`БД: дубликат названия (case-insensitive): "${name}"`);
    }
    nameLowerToId.set(lower, c.id);
  }

  const usedSlugs = new Set(categories.map((c) => (c.slug ?? "").trim()).filter(Boolean));

  for (const cat of categories) {
    const name = (cat.name ?? "").trim();
    const oldSlug = (cat.slug ?? "").trim();
    const expectedSlug = slugify(name) || "category";

    if (name !== (cat.name ?? "")) {
      report.nameTrimmed++;
      await supabase.from("categories").update({ name }).eq("id", cat.id);
    }

    if (!oldSlug) {
      report.bugs.push(`БД: категория id=${cat.id} "${name}" без slug`);
    }

    if (oldSlug !== expectedSlug) {
      usedSlugs.delete(oldSlug);
      let newSlug = expectedSlug;
      let n = 1;
      while (usedSlugs.has(newSlug)) {
        newSlug = `${expectedSlug}-${++n}`;
      }
      usedSlugs.add(newSlug);
      const { error: upErr } = await supabase.from("categories").update({ slug: newSlug }).eq("id", cat.id);
      if (upErr) {
        report.bugs.push(`БД: не удалось обновить slug для id=${cat.id}: ${upErr.message}`);
        usedSlugs.add(oldSlug);
        usedSlugs.delete(newSlug);
      } else {
        report.slugFixed++;
        if (n > 1) report.slugConflictsResolved++;
        report.slugChanges.push({ id: cat.id, name: name || String(cat.id), oldSlug, newSlug });
      }
    }
  }

  // Актуальный список slug после правок
  const { data: catRows2 } = await supabase
    .from("categories")
    .select("id, slug")
    .order("sort_order", { ascending: true });
  const validSlugs = new Set(
    (catRows2 ?? []).map((r: { slug: string | null }) => (r.slug ?? "").trim()).filter(Boolean)
  );

  // ——— 2) Связи: products ———
  const { data: products } = await supabase
    .from("products")
    .select("id, name, category_slug, category_slugs");
  for (const p of products ?? []) {
    const id = p.id;
    const name = (p.name ?? "").trim() || id;
    const main = (p.category_slug ?? "").trim();
    const arr = (p.category_slugs ?? []) as string[];
    if (main && !validSlugs.has(main)) {
      report.brokenProductLinks.push({ source: "products", id, name, slug: main });
    }
    for (const s of arr) {
      const t = (s ?? "").trim();
      if (t && !validSlugs.has(t)) {
        report.brokenProductLinks.push({ source: "products (category_slugs)", id, name, slug: t });
      }
    }
  }

  // ——— 3) Связи: variant_products ———
  const { data: variants } = await supabase
    .from("variant_products")
    .select("id, name, category_slug, category_slugs");
  for (const v of variants ?? []) {
    const id = String(v.id);
    const name = (v.name ?? "").trim() || id;
    const main = (v.category_slug ?? "").trim();
    const arr = (v.category_slugs ?? []) as string[];
    if (main && !validSlugs.has(main)) {
      report.brokenProductLinks.push({ source: "variant_products", id, name, slug: main });
    }
    for (const s of arr) {
      const t = (s ?? "").trim();
      if (t && !validSlugs.has(t)) {
        report.brokenProductLinks.push({
          source: "variant_products (category_slugs)",
          id,
          name,
          slug: t,
        });
      }
    }
  }

  // ——— Отчёт ———
  console.log("\n========== АУДИТ КАТЕГОРИЙ ==========\n");
  console.log("Данные:");
  console.log("  Категорий всего:        ", report.categoriesTotal);
  console.log("  Исправлено slug:         ", report.slugFixed);
  console.log("  Подправлено name (trim):", report.nameTrimmed);
  console.log("  Конфликтов slug (-2,-3):", report.slugConflictsResolved);

  if (report.slugChanges.length > 0) {
    console.log("\nИзменённые slug (id | name | oldSlug -> newSlug):");
    console.log("-".repeat(75));
    for (const c of report.slugChanges) {
      console.log(`${c.id} | ${c.name.slice(0, 22).padEnd(22)} | ${c.oldSlug} -> ${c.newSlug}`);
    }
  }

  if (report.bugs.length > 0) {
    console.log("\nНайденные баги:");
    report.bugs.forEach((b) => console.log("  -", b));
  }

  if (report.brokenProductLinks.length > 0) {
    console.log("\nБитые связи (товар ссылается на несуществующий slug):");
    const uniq = new Map<string, typeof report.brokenProductLinks[0]>();
    report.brokenProductLinks.forEach((l) => uniq.set(`${l.source}:${l.id}:${l.slug}`, l));
    uniq.forEach((l) => console.log(`  - ${l.source} id=${l.id} "${l.name}" → slug="${l.slug}"`));
  }

  console.log("\n========================================\n");
}

main();
