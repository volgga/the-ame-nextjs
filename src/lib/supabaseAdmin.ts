/**
 * Supabase-клиент с Service Role key — только для серверных админ-операций.
 * НЕ экспортировать на клиент. Использовать только в API routes и server actions.
 */

import { createClient } from "@supabase/supabase-js";

let adminClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (adminClient) return adminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL must be set for admin operations");
  }
  adminClient = createClient(url, key, {
    auth: { persistSession: false },
  });
  return adminClient;
}
