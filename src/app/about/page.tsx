import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "О нас",
  description:
    "The Ame — уютный цветочный магазин в Сочи, где цветы подбирают с душой. Премиальные букеты и авторские композиции.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#fff8ea]">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">
          О нас
        </h1>
        <p className="text-xl text-[#7e7e7e] mb-8 text-center">
          The Ame — цветочный магазин в Сочи
        </p>
        <div className="max-w-3xl mx-auto text-lg text-[#4b4b4b] space-y-4">
          <p>
            The Ame — уютный цветочный магазин в Сочи на ул. Пластунская 123А,
            корпус 2, этаж 2, офис 84, где цветы подбирают с душой.
          </p>
          <p>
            В нашем каталоге — монобукеты из роз, пионов, хризантем, гортензий,
            тюльпанов и ромашек, а также авторские букеты, композиции в коробках
            или корзинах, и премиум-букеты для особых случаев.
          </p>
          <p>
            Каждый цветок свежий и отборный, а гарантия на 3 дня даёт уверенность
            в качестве: если букет не понравится — заменим бесплатно.
          </p>
        </div>
      </div>
    </div>
  );
}
