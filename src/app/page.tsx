import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { ReviewsSection } from "@/components/home/ReviewsSection";
import { WelcomeBonusModal } from "@/components/home/WelcomeBonusModal";

/**
 * Главная страница (Server Component по умолчанию).
 * Интерактивные части вынесены в отдельные компоненты с `use client`.
 */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#fff8ea]">
      <WelcomeBonusModal />
      <HeroCarousel />
      <FeaturedProducts />
      <ReviewsSection />

      {/* ====== Расширенный SEO-блок (как в original-project) ====== */}
      <section className="py-24 bg-[#fff8ea]" aria-labelledby="seo-the-ame">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-6xl text-center">
            {/* Главный заголовок */}
            <h2
              id="seo-the-ame"
              className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-[#000]"
            >
              The Ame — цветочный магазин в Сочи, где каждый букет говорит о чувствах.
            </h2>

            {/* Подзаголовок */}
            <p className="mt-6 text-xl md:text-2xl leading-relaxed text-[#7e7e7e]">
              Свежесть и стиль в каждом лепестке
            </p>

            {/* Декоративный разделитель */}
            <div className="mt-10 mx-auto h-px w-28 bg-[#eaeaea]" />

            {/* Блок 1 */}
            <div className="mt-12 text-left md:text-center">
              <p className="mx-auto max-w-4xl text-lg md:text-xl leading-8 text-[#4b4b4b]">
                The Ame — уютный цветочный магазин в Сочи на ул. Пластунская 123А,
                корпус 2, этаж 2, офис 84, где цветы подбирают с душой. В нашем
                каталоге — монобукеты из роз, пионов, хризантем, гортензий,
                тюльпанов и ромашек, а также авторские букеты, композиции в
                коробках или корзинах, и премиум-букеты для особых случаев.
                Каждый цветок свежий и отборный, а гарантия на 3 дня даёт
                уверенность в качестве: если букет не понравится — заменим
                бесплатно.
              </p>
            </div>

            {/* Разделитель */}
            <div className="mt-12 mx-auto h-px w-24 bg-[#f0f0f0]" />

            {/* Блок 2 */}
            <div className="mt-12">
              <h3 className="text-2xl md:text-3xl font-semibold text-[#000]">
                Быстрая доставка цветов по всему Сочи
              </h3>
              <p className="mt-5 mx-auto max-w-4xl text-lg md:text-xl leading-8 text-[#4b4b4b]">
                Закажите доставку цветов в Сочи — мы привезём букет уже через 45
                минут. Работаем во всех районах: Центр, Адлер, Хоста, Сириус,
                Мацеста, Лоо, Дагомыс и Красная Поляна. Это идеальный способ
                подарить цветы в Сочи любимой девушке, жене, маме, бабушке,
                сестре, подруге, коллеге, учителю или начальнику. Мы
                позаботимся о стильной упаковке и ярких эмоциях получателя.
              </p>
            </div>

            {/* Разделитель */}
            <div className="mt-12 mx-auto h-px w-24 bg-[#f0f0f0]" />

            {/* Блок 3 */}
            <div className="mt-12">
              <h3 className="text-2xl md:text-3xl font-semibold text-[#000]">
                Букеты для всех праздников и важных событий
              </h3>
              <p className="mt-5 mx-auto max-w-4xl text-lg md:text-xl leading-8 text-[#4b4b4b]">
                В The Ame вы можете купить букет в Сочи на любой повод: 8 Марта,
                14 февраля, Новый год, день рождения, юбилей, выпускной, День
                матери, День учителя, свадьбу, годовщину, рождение ребёнка,
                корпоратив или просто «без повода» — чтобы сказать «спасибо» или
                «люблю». У нас есть сезонные коллекции, подарочные корзины с
                фруктами и сладостями, ароматные свечи и стильные вазы — всё,
                чтобы ваш подарок был особенным.
              </p>
            </div>

            {/* CTA-текст */}
            <p className="mt-14 mx-auto max-w-3xl text-lg md:text-xl font-medium leading-8 text-[#2b2b2b]">
              Выберите букет или купите онлайн прямо сейчас — и пусть цветы The
              Ame создадут настроение, наполняя каждый момент красотой и теплом.
            </p>
          </div>
        </div>
      </section>
      {/* ====== /Расширенный SEO-блок ====== */}
    </div>
  );
}
