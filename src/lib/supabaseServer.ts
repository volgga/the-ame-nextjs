/**
 * Supabase-клиент для API routes (сервер).
 * Использует те же env, что и клиент; для orders таблицы нужны политики RLS (anon insert/select/update).
 */

import { createClient } from "@supabase/supabase-js";

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return { url, key };
}

/** Singleton для использования в API routes. */
let serverSupabase: ReturnType<typeof createClient> | null = null;

export function getSupabaseServer() {
  if (serverSupabase) return serverSupabase;
  const { url, key } = getEnv();
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not set");
  }
  serverSupabase = createClient(url, key);
  return serverSupabase;
}
