import { permanentRedirect } from "next/navigation";

/**
 * Редирект со старого URL каталога на новый.
 * Основной редирект выполняется в middleware; эта страница — запасной вариант.
 */
export default function CatalogRedirectPage() {
  permanentRedirect("/posmotret-vse-tsvety");
}
