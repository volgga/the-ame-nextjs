import Image from "next/image";
import DOMPurify from "isomorphic-dompurify";

type InfoBlockData = {
  info_subtitle?: string | null;
  info_description?: string | null;
  info_content?: string | null;
  info_image_url?: string | null;
};

type CategoryInfoBlockProps = {
  data: InfoBlockData;
};

export function CategoryInfoBlock({ data }: CategoryInfoBlockProps) {
  const hasSubtitle = data.info_subtitle?.trim();
  const hasDescription = data.info_description?.trim();
  const hasContent = data.info_content?.trim();
  const hasImage = data.info_image_url?.trim();

  if (!hasSubtitle && !hasDescription && !hasContent && !hasImage) {
    return null;
  }

  const safeContent = hasContent
    ? DOMPurify.sanitize(data.info_content!, {
        ALLOWED_TAGS: ["h2", "h3", "p", "ul", "ol", "li", "strong", "em", "b", "i", "a", "br"],
        ALLOWED_ATTR: ["href", "target", "rel"],
      })
    : "";

  return (
    <section
      className="mt-12 pt-8 border-t border-border-block w-full max-w-full min-w-0"
      aria-labelledby={hasSubtitle ? "category-info-title" : undefined}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-10 items-start">
        {/* Текстовая колонка слева */}
        <div className="min-w-0 space-y-4">
          {hasSubtitle && (
            <h2 id="category-info-title" className="text-xl md:text-2xl font-semibold text-color-text-main">
              {data.info_subtitle}
            </h2>
          )}
          {hasDescription && (
            <p className="text-color-text-secondary text-sm md:text-base leading-relaxed">
              {data.info_description}
            </p>
          )}
          {safeContent && (
            <div
              className="prose prose-sm md:prose-base text-color-text-secondary [&_h2]:text-lg [&_h2]:md:text-xl [&_h2]:font-semibold [&_h2]:text-color-text-main [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:first:mt-0 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-color-text-main [&_h3]:mt-3 [&_h3]:mb-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-color-text-main [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-color-text-secondary"
              dangerouslySetInnerHTML={{ __html: safeContent }}
            />
          )}
        </div>
        {/* Фото справа - квадратное */}
        {hasImage && (
          <div className="w-full flex-shrink-0 overflow-hidden rounded-xl bg-[rgba(31,42,31,0.06)] aspect-square relative">
            <Image
              src={data.info_image_url!}
              alt={data.info_subtitle || "Изображение"}
              fill
              className="object-cover block w-full h-full"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        )}
      </div>
    </section>
  );
}
