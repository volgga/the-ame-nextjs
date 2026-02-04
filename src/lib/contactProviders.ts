export type ProviderType = "telegram" | "whatsapp" | "instagram" | "max" | "phone";

export type ContactProvider = {
  type: ProviderType;
  src: string;
  srcModal: string;
  label: string;
  background: string;
  url?: string;
};

export const contactProviders: ContactProvider[] = [
  {
    type: "telegram",
    src: "/icons/telegram-white.svg",
    srcModal: "/icons/telegram-white.svg",
    label: "Telegram",
    background: "linear-gradient(135deg, #229ED9, #1C7FC2)",
    url: "https://t.me/the_ame_flowers",
  },
  {
    type: "whatsapp",
    src: "/icons/whatsapp-white.svg",
    srcModal: "/icons/whatsapp.svg",
    label: "WhatsApp",
    background: "linear-gradient(135deg, #25D366, #1EBE5B)",
    url: "https://wa.me/message/XQDDWGSEL35LP1",
  },
  {
    type: "instagram",
    src: "/icons/instagram-white.svg",
    srcModal: "/icons/instagram.svg",
    label: "Instagram",
    background: "linear-gradient(135deg, #F58529, #DD2A7B)",
    url: "https://www.instagram.com/theame.flowers",
  },
  {
    type: "max",
    src: "/icons/max4-messenger-color-icon.png",
    srcModal: "/icons/max4-messenger-color-icon.png",
    label: "MAX",
    background: "linear-gradient(135deg, #2F6BFF, #6A3DF0)",
    url: "https://max.ru/u/f9LHodD0cOJJBRShH_taOp567aS5B7oZt4PZHqOvsl782HDW1tNY1II4OTY",
  },
  {
    type: "phone",
    src: "/icons/phone-white.svg",
    srcModal: "/icons/phone-white.svg",
    label: "Телефон",
    background: "linear-gradient(135deg, #6B7F5E, #C2B59B)",
    url: "tel:+79939326095",
  },
];
