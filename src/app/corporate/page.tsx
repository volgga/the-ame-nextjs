import type { Metadata } from "next";
import { canonicalUrl, ROBOTS_INDEX_FOLLOW, LOCALE } from "@/lib/seo";
import { getCorporatePage, getCorporatePageDefaults } from "@/lib/corporatePage";
import { CorporateHeroGallery } from "@/components/docs/CorporateHeroGallery";
import { CorporateCtaButtons } from "@/components/docs/CorporateCtaButtons";
import { MAIN_PAGE_BLOCK_GAP } from "@/components/ui/breadcrumbs";

const CORPORATE_SEO_TITLE = "Оформление мероприятий от цветочной студии The Ame в Сочи";
const CORPORATE_SEO_DESCRIPTION =
  "Команда The Ame с любовью оформит ваш фасад, входную группу или мероприятие под ключ, поможет создать вау-эффект и повысить узнаваемость вашего бизнеса, отразив его ценности и настроение!";

export const metadata: Metadata = {
  title: CORPORATE_SEO_TITLE,
  description: CORPORATE_SEO_DESCRIPTION,
  alternates: {
    canonical: canonicalUrl("/corporate"),
  },
  robots: ROBOTS_INDEX_FOLLOW,
  openGraph: {
    type: "website",
    locale: LOCALE,
    url: canonicalUrl("/corporate"),
    title: CORPORATE_SEO_TITLE,
    description: CORPORATE_SEO_DESCRIPTION,
  },
};

export default async function CorporatePage() {
  const page = await getCorporatePage();
  const defaults = getCorporatePageDefaults();

  const title = page?.title?.trim() || defaults.title;
  const text = page?.text?.trim() || defaults.text;
  const images = page?.images ?? [];
  const maxLink = page?.max_link ?? null;

  return (
    <div className="min-h-screen bg-page-bg">
      <section className={`container mx-auto px-4 md:px-6 ${MAIN_PAGE_BLOCK_GAP} pb-8 md:pb-12`}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
          {/* Текст и кнопки: на mobile первыми (сверху), на desktop слева */}
          <div className="order-1 flex flex-col justify-center">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#111] mb-4 md:mb-6 tracking-tight">
              {title}
            </h1>
            <p className="text-base md:text-lg text-[#333] leading-relaxed mb-6 md:mb-8 whitespace-pre-line">
              {text}
            </p>
            <CorporateCtaButtons maxLink={maxLink} />
          </div>

          {/* Галерея: на mobile под кнопками, на desktop справа */}
          <div className="order-2 w-full rounded-xl overflow-hidden corporate-gallery-wrap">
            <CorporateHeroGallery images={images} className="rounded-xl h-full w-full" />
          </div>
        </div>
      </section>
    </div>
  );
}
