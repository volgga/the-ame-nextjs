import Link from "next/link";
import { ROBOTS_NOINDEX_FOLLOW } from "@/lib/seo";

export const metadata = {
  title: "Страница не найдена | The Ame",
  robots: ROBOTS_NOINDEX_FOLLOW,
};

/**
 * Страница 404. Next.js App Router автоматически отдаёт HTTP 404 при рендере этого компонента.
 * Редиректов на главную нет — только честный 404 для SEO.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-5 py-16">
      <h1 className="text-6xl font-semibold text-neutral-800">404</h1>
      <p className="mt-3 text-center text-lg text-neutral-600">
        Страница не найдена
      </p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-neutral-900 px-6 py-3 text-white transition hover:bg-neutral-800"
      >
        На главную
      </Link>
    </div>
  );
}
