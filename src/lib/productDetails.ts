/**
 * Глобальные детали товаров (Подарок при заказе).
 * Один набор на весь каталог — хранится в таблице product_details (singleton).
 */

import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/supabaseClient";

export type ProductDetails = {
  kit: string;
};

const DEFAULT: ProductDetails = {
  kit: "",
};

async function getProductDetailsUncached(): Promise<ProductDetails> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return DEFAULT;

  try {
    const { data, error } = await supabase.from("product_details").select("kit").eq("id", 1).maybeSingle();

    if (error) {
      if (error.code === "42P01" || error.code === "PGRST116") return DEFAULT;
      console.warn("[productDetails] Ошибка загрузки:", error.message);
      return DEFAULT;
    }

    if (!data) return DEFAULT;

    return {
      kit: typeof data.kit === "string" ? data.kit : "",
    };
  } catch {
    return DEFAULT;
  }
}

export async function getProductDetails(): Promise<ProductDetails> {
  return unstable_cache(getProductDetailsUncached, ["product-details"], {
    revalidate: 300,
    tags: ["product-details"],
  })();
}
