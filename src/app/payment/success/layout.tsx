import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Оплата прошла успешно | The Ame",
  description: "Заказ успешно оплачен. The Ame — доставка цветов по Сочи.",
  alternates: { canonical: "https://theame.ru/payment/success" },
  robots: { index: false, follow: true },
};

export default function PaymentSuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
