import type { Metadata } from "next";
import { Cart } from "@/components/cart/Cart";

export const metadata: Metadata = {
  title: "Корзина",
  description: "Ваша корзина покупок в The Ame",
};

export default function CartPage() {
  return (
    <div className="min-h-screen bg-[#fff8ea]">
      <Cart />
    </div>
  );
}
