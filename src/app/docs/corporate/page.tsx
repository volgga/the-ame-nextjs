import type { Metadata } from "next";
import { canonicalUrl, ROBOTS_INDEX_FOLLOW, SITE_NAME, LOCALE } from "@/lib/seo";
import { getCorporatePage, getCorporatePageDefaults } from "@/lib/corporatePage";
import { CorporateHeroGallery } from "@/components/docs/CorporateHeroGallery";
import { CorporateCtaButtons } from "@/components/docs/CorporateCtaButtons";

const DEFAULT_SEO_TITLE = "Оформление мероприятий от цветочной студии The Ame в Сочи";
const DEFAULT_SEO_DESCRIPTION =
  "Команда The Ame с любовью оформит ваш фасад, входную группу или мероприятие под ключ, поможет создать вау-эффект и повысить узнаваемость вашего бизнеса, отразив его ценности и настроение!";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCorporatePage();
  const defaults = getCorporatePageDefaults();
  const title = page?.seo_title?.trim() || defaults.seo_title || DEFAULT_SEO_TITLE;
  const description = page?.seo_description?.trim() || defaults.seo_description || DEFAULT_SEO_DESCRIPTION;

  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    alternates: {
      canonical: canonicalUrl("/docs/corporate"),
    },
    robots: ROBOTS_INDEX_FOLLOW,
    openGraph: {
      type: "website",
      locale: LOCALE,
      url: canonicalUrl("/docs/corporate"),
      siteName: SITE_NAME,
      title,
      description,
    },
  };
}

export default async function CorporatePage() {
  const page = await getCorporatePage();
  const defaults = getCorporatePageDefaults();

  const title = page?.title?.trim() || defaults.title;
  const text = page?.text?.trim() || defaults.text;
  const images = page?.images ?? [];
  const maxLink = page?.max_link ?? null;

  return (
    <div className="min-h-screen bg-page-bg">
      {/* Hero: галерея слева/сверху, контент справа/снизу */}
      <section className="container mx-auto px-4 md:px-6 py-6 md:py-10 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
          {/* Галерея — на мобиле первая, на десктопе слева */}
          <div className="w-full order-1 lg:order-1 min-h-[280px] sm:min-h-[320px] md:min-h-[380px] lg:min-h-0 lg:h-[420px] rounded-xl overflow-hidden">
            <CorporateHeroGallery images={images} className="rounded-xl h-full w-full" />
          </div>

          {/* Заголовок + текст + кнопки */}
          <div className="order-2 lg:order-2 flex flex-col justify-center lg:pl-0">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#111] mb-4 md:mb-6 tracking-tight">
              {title}
            </h1>
            <p className="text-base md:text-lg text-[#333] leading-relaxed mb-6 md:mb-8 whitespace-pre-line">
              {text}
            </p>
            <CorporateCtaButtons maxLink={maxLink} />
          </div>
        </div>
      </section>
    </div>
  );
}
