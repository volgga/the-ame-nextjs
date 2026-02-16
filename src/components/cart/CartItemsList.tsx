"use client";

import { useState } from "react";
import { Plus, Minus, X } from "lucide-react";
import { AppImage } from "@/components/ui/AppImage";
import { useCart } from "@/context/CartContext";
import { PLACEHOLDER_IMAGE, isValidImageUrl } from "@/utils/imageUtils";
import { trackRemoveFromCart } from "@/lib/metrika/ecommerce";

/**
 * CartItemsList — список товаров в корзине.
 * Показывает каждый товар с изображением, названием, количеством и управлением.
 */
export function CartItemsList() {
  const { state, updateQuantity, removeFromCart } = useCart();

  const updateItemQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  return (
    <div className="space-y-4">
      {state.items.map((item) => (
        <CartItemRow key={item.id} item={item} updateQuantity={updateItemQuantity} removeFromCart={removeFromCart} />
      ))}
    </div>
  );
}

function CartItemRow({
  item,
  updateQuantity,
  removeFromCart,
}: {
  item: {
    id: string;
    name: string;
    image: string;
    price: number;
    cartQuantity: number;
    variantTitle?: string | null;
    category?: string;
  };
  updateQuantity: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const imageSrc = !isValidImageUrl(item.image) || imgError ? PLACEHOLDER_IMAGE : item.image!.trim();

  const ecommerceProduct = {
    id: item.id,
    name: item.name,
    price: item.price,
    category: item.category,
    variant: item.variantTitle ?? undefined,
  };

  const handleRemove = () => {
    trackRemoveFromCart(ecommerceProduct, item.cartQuantity);
    removeFromCart(item.id);
  };

  const handleDecrease = () => {
    if (item.cartQuantity <= 1) {
      trackRemoveFromCart(ecommerceProduct, 1);
      updateQuantity(item.id, 0);
    } else {
      updateQuantity(item.id, item.cartQuantity - 1);
    }
  };

  return (
    <div className="flex gap-3">
      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-[#ece9e2] flex-shrink-0">
        <AppImage
          src={imageSrc}
          alt={item.name}
          fill
          variant="thumb"
          sizes="80px"
          loading="lazy"
          // TODO: Добавить imageData когда данные корзины будут включать варианты изображений
          className="object-cover"
          onError={() => setImgError(true)}
        />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm mb-1 line-clamp-2">{item.name}</h3>
        {item.variantTitle && <p className="text-xs text-muted-foreground mb-1">Вариант: {item.variantTitle}</p>}
        {item.cartQuantity > 1 && <p className="text-xs text-muted-foreground mb-2">Количество: {item.cartQuantity}</p>}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDecrease}
            className="w-9 h-9 min-w-[44px] min-h-[44px] rounded-full border border-gray-300 hover:bg-gray-100 flex items-center justify-center transition-colors touch-manipulation"
            aria-label="Уменьшить количество"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-6 text-center text-sm font-medium min-w-[24px]">{item.cartQuantity}</span>
          <button
            type="button"
            onClick={() => updateQuantity(item.id, item.cartQuantity + 1)}
            className="w-9 h-9 min-w-[44px] min-h-[44px] rounded-full border border-gray-300 hover:bg-gray-100 flex items-center justify-center transition-colors touch-manipulation"
            aria-label="Увеличить количество"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex flex-col items-end justify-between">
        <div className="font-semibold text-sm">{(item.price * item.cartQuantity).toLocaleString("ru-RU")} р.</div>
        <button
          type="button"
          onClick={handleRemove}
          className="w-10 h-10 min-w-[44px] min-h-[44px] rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors touch-manipulation"
          aria-label="Удалить товар"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
}
