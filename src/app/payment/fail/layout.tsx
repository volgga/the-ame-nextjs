import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ошибка оплаты | The Ame",
  description: "Оплата не прошла. Повторите попытку или выберите другой способ оплаты.",
  alternates: { canonical: "https://theame.ru/payment/fail" },
  robots: { index: false, follow: true },
  openGraph: {
    title: "Ошибка оплаты | The Ame",
    description: "Оплата не прошла. Повторите попытку или выберите другой способ оплаты.",
    url: "https://theame.ru/payment/fail",
    siteName: "The Ame",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Ошибка оплаты | The Ame",
    description: "Оплата не прошла. Повторите попытку или выберите другой способ оплаты.",
  },
};

export default function PaymentFailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
