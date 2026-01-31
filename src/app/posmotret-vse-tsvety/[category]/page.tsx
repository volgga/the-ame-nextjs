import { permanentRedirect } from "next/navigation";

type CategoryRedirectProps = {
  params: Promise<{ category: string }>;
};

/**
 * Редирект со старого URL категории на новый /magazine/<slug>.
 * Основной редирект выполняется в middleware; эта страница — запасной вариант.
 */
export default async function PosmotretVseTsvetyCategoryRedirectPage({ params }: CategoryRedirectProps) {
  const { category } = await params;
  permanentRedirect(`/magazine/${category}`);
}
