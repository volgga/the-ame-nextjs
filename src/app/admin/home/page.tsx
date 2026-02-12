"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import type { AboutFormRef } from "@/components/admin/home/AboutForm";
import type { ReviewsFormRef } from "@/components/admin/home/ReviewsForm";
import type { FaqFormRef } from "@/components/admin/home/FaqForm";
import type { OrderBlockFormRef } from "@/components/admin/home/OrderBlockForm";
import type { MarqueeFormRef } from "@/components/admin/home/MarqueeForm";
import type { PromoFormRef } from "@/components/admin/home/PromoForm";

const MarqueeForm = dynamic(
  () => import("@/components/admin/home/MarqueeForm").then((m) => ({ default: m.MarqueeForm })),
  { loading: () => <div className="h-20 animate-pulse rounded bg-gray-200" />, ssr: false }
);
const ReviewsForm = dynamic(
  () => import("@/components/admin/home/ReviewsForm").then((m) => ({ default: m.ReviewsForm })),
  { loading: () => <div className="h-20 animate-pulse rounded bg-gray-200" />, ssr: false }
);
const AboutForm = dynamic(() => import("@/components/admin/home/AboutForm").then((m) => ({ default: m.AboutForm })), {
  loading: () => <div className="h-20 animate-pulse rounded bg-gray-200" />,
  ssr: false,
});
const FaqForm = dynamic(() => import("@/components/admin/home/FaqForm").then((m) => ({ default: m.FaqForm })), {
  loading: () => <div className="h-20 animate-pulse rounded bg-gray-200" />,
  ssr: false,
});
const OrderBlockForm = dynamic(
  () => import("@/components/admin/home/OrderBlockForm").then((m) => ({ default: m.OrderBlockForm })),
  { loading: () => <div className="h-20 animate-pulse rounded bg-gray-200" />, ssr: false }
);
const PromoForm = dynamic(() => import("@/components/admin/home/PromoForm").then((m) => ({ default: m.PromoForm })), {
  loading: () => <div className="h-20 animate-pulse rounded bg-gray-200" />,
  ssr: false,
});

/**
 * Раздел «Главная страница» в админке.
 * Подразделы (в порядке): 1. Коллекции, 2. О нас, 3. Форма с заказом, 4. Часто задаваемые вопросы, 5. Отзывы.
 */
export default function AdminHomePage() {
  const [reviewsModalOpen, setReviewsModalOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [orderBlockModalOpen, setOrderBlockModalOpen] = useState(false);
  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [aboutDirty, setAboutDirty] = useState(false);
  const [reviewsDirty, setReviewsDirty] = useState(false);
  const [orderBlockDirty, setOrderBlockDirty] = useState(false);
  const [faqDirty, setFaqDirty] = useState(false);
  const [marqueeModalOpen, setMarqueeModalOpen] = useState(false);
  const [marqueeDirty, setMarqueeDirty] = useState(false);
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [promoDirty, setPromoDirty] = useState(false);
  const aboutFormRef = useRef<AboutFormRef>(null);
  const reviewsFormRef = useRef<ReviewsFormRef>(null);
  const orderBlockFormRef = useRef<OrderBlockFormRef>(null);
  const faqFormRef = useRef<FaqFormRef>(null);
  const marqueeFormRef = useRef<MarqueeFormRef>(null);
  const promoFormRef = useRef<PromoFormRef>(null);

  return (
    <>
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-[#111]">Главная страница</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/admin/home/collections"
            className="block rounded-xl border border-border-block bg-white hover:border-border-block-hover p-6 shadow-sm hover:shadow transition"
          >
            <h3 className="font-medium text-[#111]">Коллекции</h3>
            <p className="mt-1 text-sm text-gray-500">Карточки блока «КОЛЛЕКЦИИ THE ÁME» на главной</p>
          </Link>
          <button
            onClick={() => setMarqueeModalOpen(true)}
            className="block rounded-xl border border-border-block bg-white hover:border-border-block-hover p-6 shadow-sm hover:shadow transition text-left w-full cursor-pointer"
          >
            <h3 className="font-medium text-[#111]">Бегущая дорожка</h3>
            <p className="mt-1 text-sm text-gray-500">Текст и ссылка бегущей строки над шапкой, вкл/выкл</p>
          </button>
          <button
            onClick={() => setPromoModalOpen(true)}
            className="block rounded-xl border border-border-block bg-white hover:border-border-block-hover p-6 shadow-sm hover:shadow transition text-left w-full cursor-pointer"
          >
            <h3 className="font-medium text-[#111]">Промокод(ы)</h3>
            <p className="mt-1 text-sm text-gray-500">Управление промокодами для скидок в корзине</p>
          </button>
          <button
            onClick={() => setAboutModalOpen(true)}
            className="block rounded-xl border border-border-block bg-white hover:border-border-block-hover p-6 shadow-sm hover:shadow transition text-left w-full cursor-pointer"
          >
            <h3 className="font-medium text-[#111]">О нас</h3>
            <p className="mt-1 text-sm text-gray-500">Редактирование секции «О нас» на главной</p>
          </button>
          <button
            onClick={() => setOrderBlockModalOpen(true)}
            className="block rounded-xl border border-border-block bg-white hover:border-border-block-hover p-6 shadow-sm hover:shadow transition text-left w-full cursor-pointer"
          >
            <h3 className="font-medium text-[#111]">Форма с заказом</h3>
            <p className="mt-1 text-sm text-gray-500">Заголовок, текст и изображение блока с формой заказа</p>
          </button>
          <button
            onClick={() => setFaqModalOpen(true)}
            className="block rounded-xl border border-border-block bg-white hover:border-border-block-hover p-6 shadow-sm hover:shadow transition text-left w-full cursor-pointer"
          >
            <h3 className="font-medium text-[#111]">Часто задаваемые вопросы</h3>
            <p className="mt-1 text-sm text-gray-500">Управление вопросами и ответами FAQ на главной</p>
          </button>
          <button
            onClick={() => setReviewsModalOpen(true)}
            className="block rounded-xl border border-border-block bg-white hover:border-border-block-hover p-6 shadow-sm hover:shadow transition text-left w-full cursor-pointer"
          >
            <h3 className="font-medium text-[#111]">Отзывы</h3>
            <p className="mt-1 text-sm text-gray-500">Настройки секции «Отзывы клиентов» на главной</p>
          </button>
        </div>
      </div>

      {/* Модалки с защитой от потери несохранённых изменений */}
      <Modal
        isOpen={reviewsModalOpen}
        onClose={() => setReviewsModalOpen(false)}
        title="Отзывы"
        unsavedChanges={reviewsDirty}
        onSaveAndClose={async () => {
          await reviewsFormRef.current?.save();
        }}
      >
        <ReviewsForm formRef={reviewsFormRef} onDirtyChange={setReviewsDirty} />
      </Modal>

      <Modal
        isOpen={aboutModalOpen}
        onClose={() => setAboutModalOpen(false)}
        title="О нас"
        unsavedChanges={aboutDirty}
        onSaveAndClose={async () => {
          await aboutFormRef.current?.save();
        }}
      >
        <AboutForm formRef={aboutFormRef} onDirtyChange={setAboutDirty} />
      </Modal>

      <Modal
        isOpen={orderBlockModalOpen}
        onClose={() => setOrderBlockModalOpen(false)}
        title="Форма с заказом"
        unsavedChanges={orderBlockDirty}
        onSaveAndClose={async () => {
          await orderBlockFormRef.current?.save();
        }}
      >
        <OrderBlockForm formRef={orderBlockFormRef} onDirtyChange={setOrderBlockDirty} />
      </Modal>

      <Modal
        isOpen={faqModalOpen}
        onClose={() => setFaqModalOpen(false)}
        title="Часто задаваемые вопросы"
        unsavedChanges={faqDirty}
        onSaveAndClose={async () => {
          await faqFormRef.current?.save();
        }}
      >
        <FaqForm formRef={faqFormRef} onDirtyChange={setFaqDirty} />
      </Modal>

      <Modal
        isOpen={marqueeModalOpen}
        onClose={() => setMarqueeModalOpen(false)}
        title="Бегущая дорожка"
        unsavedChanges={marqueeDirty}
        onSaveAndClose={async () => {
          await marqueeFormRef.current?.save();
        }}
      >
        <MarqueeForm formRef={marqueeFormRef} onDirtyChange={setMarqueeDirty} />
      </Modal>

      <Modal
        isOpen={promoModalOpen}
        onClose={() => setPromoModalOpen(false)}
        title="Промокод(ы)"
        unsavedChanges={promoDirty}
        onSaveAndClose={async () => {
          await promoFormRef.current?.save();
        }}
      >
        <PromoForm formRef={promoFormRef} onDirtyChange={setPromoDirty} />
      </Modal>
    </>
  );
}
