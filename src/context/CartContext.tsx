"use client";

import React, { createContext, useContext, useReducer, useEffect } from "react";
import { Flower, CartItem } from "@/types/flower";

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

interface CartContextType {
  state: CartState;
  addToCart: (flower: Flower) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  // Для доп.товаров (addon items)
  addAddonToCart: (addon: Flower) => void;
  isAddonInCart: (id: string) => boolean;
}

type CartAction =
  | { type: "ADD_TO_CART"; payload: Flower }
  | { type: "REMOVE_FROM_CART"; payload: string }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "LOAD_CART"; payload: CartItem[] };

const CartContext = createContext<CartContextType | undefined>(undefined);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "ADD_TO_CART": {
      const existingItem = state.items.find((item) => item.id === action.payload.id);
      let newItems: CartItem[];

      if (existingItem) {
        newItems = state.items.map((item) =>
          item.id === action.payload.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item
        );
      } else {
        newItems = [...state.items, { ...action.payload, cartQuantity: 1 }];
      }

      return calculateTotals(newItems);
    }

    case "REMOVE_FROM_CART": {
      const newItems = state.items.filter((item) => item.id !== action.payload);
      return calculateTotals(newItems);
    }

    case "UPDATE_QUANTITY": {
      const newItems = state.items
        .map((item) => (item.id === action.payload.id ? { ...item, cartQuantity: action.payload.quantity } : item))
        .filter((item) => item.cartQuantity > 0);

      return calculateTotals(newItems);
    }

    case "CLEAR_CART":
      return { items: [], total: 0, itemCount: 0 };

    case "LOAD_CART":
      return calculateTotals(action.payload);

    default:
      return state;
  }
};

const calculateTotals = (items: CartItem[]): CartState => {
  const total = items.reduce((sum, item) => sum + item.price * item.cartQuantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.cartQuantity, 0);

  return { items, total, itemCount };
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    total: 0,
    itemCount: 0,
  });

  // Загрузка корзины из localStorage при инициализации
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        dispatch({ type: "LOAD_CART", payload: parsedCart });
      } catch (error) {
        console.error("Ошибка загрузки корзины:", error);
      }
    }
  }, []);

  // Сохранение корзины в localStorage при изменении
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(state.items));
  }, [state.items]);

  const addToCart = (flower: Flower) => {
    dispatch({ type: "ADD_TO_CART", payload: flower });
  };

  const removeFromCart = (id: string) => {
    dispatch({ type: "REMOVE_FROM_CART", payload: id });
  };

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: "CLEAR_CART" });
  };

  // Добавление доп.товара (addon) - всегда добавляется как отдельная позиция
  const addAddonToCart = (addon: Flower) => {
    dispatch({ type: "ADD_TO_CART", payload: addon });
  };

  // Проверка, есть ли доп.товар в корзине
  const isAddonInCart = (id: string) => {
    return state.items.some((item) => item.id === id);
  };

  return (
    <CartContext.Provider
      value={{
        state,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        addAddonToCart,
        isAddonInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
