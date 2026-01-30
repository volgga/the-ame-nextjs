import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Инструкция по уходу за цветами | The Ame",
  description:
    "Рекомендации по уходу за срезанными цветами и букетами от The Ame.",
  alternates: {
    canonical: "https://theame.ru/docs/care",
  },
};

export default function CarePage() {
  return (
    <div className="min-h-screen bg-white">
      <article className="container mx-auto px-4 py-8 md:py-12 pb-16 md:pb-20 max-w-full">
        <h1 className="text-2xl md:text-3xl font-bold text-[#000] mb-8 md:mb-10">
          Инструкция по уходу за цветами
        </h1>
        <p className="text-base md:text-lg text-[#000] leading-relaxed">
          Материал в подготовке.
        </p>
      </article>
    </div>
  );
}
