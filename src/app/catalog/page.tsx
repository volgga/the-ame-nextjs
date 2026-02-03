import { permanentRedirect } from "next/navigation";

/**
 * Редирект со старого URL каталога на главную страницу каталога /magazin.
 * Основной редирект выполняется в middleware; эта страница — запасной вариант.
 */
export default function CatalogRedirectPage() {
  permanentRedirect("/magazin");
}
