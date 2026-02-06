import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ошибка оплаты | The Ame",
  description: "Оплата не прошла. Повторите попытку или выберите другой способ оплаты.",
  alternates: { canonical: "https://theame.ru/payment/fail" },
  robots: { index: false, follow: true },
};

export default function PaymentFailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
