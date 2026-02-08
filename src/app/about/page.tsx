import type { Metadata } from "next";
import Image from "next/image";
import { canonicalUrl, ROBOTS_INDEX_FOLLOW, SITE_NAME, LOCALE } from "@/lib/seo";

const PROSE_CLASS = "space-y-5 text-[18px] leading-relaxed text-neutral-700";

const TITLE = "О студии цветов The Ame в Сочи";
const DESCRIPTION =
  "The Ame — сервис доставки цветов в Сочи. Свежие букеты, внимание к деталям и забота о каждом заказе.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: canonicalUrl("/about") },
  robots: ROBOTS_INDEX_FOLLOW,
  openGraph: {
    type: "website",
    locale: LOCALE,
    url: canonicalUrl("/about"),
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function AboutPage() {
  return (
    <div className="bg-page-bg">
      <div className="container mx-auto max-w-[980px] px-5 pb-12 pt-6 md:px-7">
        {/* A) Заголовок по центру */}
        <h1 className="mb-8 text-center text-4xl font-semibold tracking-tight text-black sm:text-5xl">О НАС</h1>

        {/* B) Первый блок текста */}
        <div className={PROSE_CLASS}>
          <p>
            <strong>The Áme началось с момента, знакомого почти каждому.</strong>
          </p>
          <p>
            Когда впереди встреча, разговор или жест, который имеет значение. Когда хочется сделать красиво, но без
            лишних слов. И именно в этот момент появляется сомнение — подойдёт ли букет, будет ли он выглядеть уместно,
            не окажется ли слишком простым или, наоборот, неуместно громким.
          </p>
        </div>

        {/* C) Фото по центру + подпись */}
        <div className="mt-12">
          <Image
            src="/IMG_1543.PNG"
            alt="The Áme"
            width={900}
            height={1200}
            priority
            className="mx-auto h-auto w-full max-w-[860px] rounded-xl"
          />
          <p className="mt-4 text-center text-sm text-neutral-500">Дарья и Александр — основатели The Áme</p>
        </div>

        {/* D) Финальный блок: 2 колонки */}
        <div className="mt-12 grid grid-cols-1 items-start gap-10 lg:grid-cols-2">
          <div className={PROSE_CLASS}>
            <p>
              Мы создали The Áme в Сочи, чтобы в такие моменты выбор был простым и спокойным. Чтобы цветы не становились
              источником стресса, а наоборот — решали задачу. Здесь не нужно долго разбираться или угадывать: мы
              собираем букеты так, чтобы они выглядели аккуратно, цельно и производили нужное впечатление.
            </p>
            <p>
              В основе The Áme — классические сочетания и понятные формы. Мы уделяем внимание деталям, пропорциям и
              тому, как букет ощущается целиком: в руках, на фото, в пространстве. Нам важно, чтобы цветы выглядели
              дороже своей цены и не требовали пояснений.
            </p>
          </div>
          <div className={PROSE_CLASS}>
            <p>
              <strong>The Áme — это про уверенность.</strong>
            </p>
            <p>
              Про моменты, когда не хочется рисковать и экспериментировать, а важно попасть точно. Про цветы, которые
              поддерживают жест, а не отвлекают от него.
            </p>
            <p>
              Мы работаем для тех, кто ценит вкус, спокойствие и ощущение контроля. Для тех, кому важно, чтобы всё было
              сделано аккуратно и вовремя. Для тех, кто выбирает цветы не ради формальности, а ради впечатления.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
