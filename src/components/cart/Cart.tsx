"use client";

import { useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { CheckoutForm } from "./CheckoutForm";

export const Cart = () => {
  const { state } = useCart();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (state.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-8">Корзина</h1>
          <p className="text-muted-foreground">Ваша корзина пуста</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Оформление заказа</h1>

        <CheckoutForm />
      </div>
    </div>
  );
};
