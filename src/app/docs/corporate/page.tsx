import type { Metadata } from "next";
import { canonicalUrl, ROBOTS_NOINDEX_FOLLOW } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Корпоративные заказы | The Ame",
  description: "Корпоративные заказы цветов от The Ame.",
  alternates: {
    canonical: canonicalUrl("/docs/corporate"),
  },
  robots: ROBOTS_NOINDEX_FOLLOW,
};

export default function CorporatePage() {
  return (
    <div className="min-h-screen bg-page-bg">
      <article className="container mx-auto px-5 md:px-6 py-8 md:py-12 max-w-full">
        <h1 className="text-2xl md:text-3xl font-bold text-[#000] mb-8 md:mb-10">Корпоративные заказы</h1>
        <p className="text-base md:text-lg text-[#000] leading-relaxed">Материал в разработке.</p>
      </article>
    </div>
  );
}
