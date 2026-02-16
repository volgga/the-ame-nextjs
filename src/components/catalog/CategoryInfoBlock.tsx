"use client";

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

  const safeContent = hasContent ? DOMPurify.sanitize(data.info_content!, { ALLOWED_TAGS: ["h2", "h3", "p", "ul", "ol", "li", "strong", "em", "b", "i", "a", "br"] }) : "";

  return (
    <section className="mt-12 pt-8 border-t border-border-block">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 md:gap-10 items-start">
        <div className="space-y-4 order-2 md:order-1">
          {hasSubtitle && (
            <h2 className="text-xl md:text-2xl font-semibold text-color-text-main">
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
              className="prose prose-sm md:prose-base max-w-none text-color-text-secondary [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-color-text-main [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
              dangerouslySetInnerHTML={{ __html: safeContent }}
            />
          )}
        </div>
        {hasImage && (
          <div className="relative w-full md:w-[min(400px,40vw)] aspect-square shrink-0 order-1 md:order-2 rounded-xl overflow-hidden bg-[rgba(31,42,31,0.06)]">
            <Image
              src={data.info_image_url!}
              alt={data.info_subtitle || "Изображение"}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
            />
          </div>
        )}
      </div>
    </section>
  );
}
