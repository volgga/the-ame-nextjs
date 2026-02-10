import { unstable_cache } from "next/cache";

/**
 * Универсальный кэш витрины сайта
 * Сбрасывается через revalidateTag("site")
 */
export function siteCache<T>(
  key: string,
  fn: () => Promise<T>
) {
  return unstable_cache(fn, [key], {
    tags: ["site"],
  })();
}
