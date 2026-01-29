/**
 * Массив товаров для главной страницы и каталога.
 * Позже заменим на данные из Supabase через SSR.
 */

export type Product = {
  id: string;
  slug: string;
  title: string;
  price: number;
  image: string;
  shortDescription: string;
};

export const products: Product[] = [
  {
    id: "1",
    slug: "rozy",
    title: "Букет «Розы»",
    price: 3900,
    image: "https://theame.ru/rose1.jpg",
    shortDescription: "Свежие розы в элегантной композиции",
  },
  {
    id: "2",
    slug: "piony",
    title: "Букет «Пионы»",
    price: 5200,
    image: "https://theame.ru/peony1.jpg",
    shortDescription: "Нежные пионы для особого момента",
  },
  {
    id: "3",
    slug: "gortenzii",
    title: "Букет «Гортензии»",
    price: 4700,
    image: "https://theame.ru/hydrangea1.jpg",
    shortDescription: "Пышные гортензии в стильной упаковке",
  },
  {
    id: "4",
    slug: "podsolnuhi",
    title: "Букет «Подсолнухи»",
    price: 3500,
    image: "https://theame.ru/sunflower1.jpg",
    shortDescription: "Яркие подсолнухи для хорошего настроения",
  },
  {
    id: "5",
    slug: "romashki",
    title: "Букет «Ромашки»",
    price: 2800,
    image: "https://theame.ru/placeholder.svg",
    shortDescription: "Классические ромашки в простой композиции",
  },
  {
    id: "6",
    slug: "tyulpany",
    title: "Букет «Тюльпаны»",
    price: 3200,
    image: "https://theame.ru/placeholder.svg",
    shortDescription: "Весенние тюльпаны разных оттенков",
  },
  {
    id: "7",
    slug: "lavanda",
    title: "Букет «Лаванда»",
    price: 4100,
    image: "https://theame.ru/lavender1.jpg",
    shortDescription: "Ароматная лаванда для уюта",
  },
  {
    id: "8",
    slug: "hrizantemy",
    title: "Букет «Хризантемы»",
    price: 3600,
    image: "https://theame.ru/placeholder.svg",
    shortDescription: "Яркие хризантемы в осенней палитре",
  },
];

/**
 * Найти товар по slug
 */
export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

/**
 * Получить все товары
 */
export function getAllProducts(): Product[] {
  return products;
}
