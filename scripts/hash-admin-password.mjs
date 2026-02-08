#!/usr/bin/env node
/**
 * Генерация bcrypt hash для пароля админки.
 * Пароль задаётся ТОЛЬКО через env ADMIN_PASSWORD_PLAIN (не в коде, не в аргументах).
 *
 * Использование:
 *   ADMIN_PASSWORD_PLAIN=yourpassword node scripts/hash-admin-password.mjs
 * Или в .env.local задать ADMIN_PASSWORD_PLAIN и запустить с dotenv:
 *   node -r dotenv/config scripts/hash-admin-password.mjs
 *
 * Вывод: одна строка — bcrypt hash (подставить в ADMIN_PASSWORD_HASH).
 */

import bcrypt from "bcryptjs"; // same API as bcrypt, pure JS

const ROUNDS = 10;
const plain = process.env.ADMIN_PASSWORD_PLAIN;

if (!plain || typeof plain !== "string") {
  console.error("Задайте пароль в env: ADMIN_PASSWORD_PLAIN=yourpassword");
  process.exit(1);
}

const hash = await bcrypt.hash(plain, ROUNDS);
console.log(hash);
