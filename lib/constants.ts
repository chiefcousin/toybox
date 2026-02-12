export const SITE_NAME = "ToyBox";
export const SITE_DESCRIPTION = "Your local toy store - browse and order via WhatsApp";

export const DEFAULT_WHATSAPP_NUMBER = ""; // Set in store_settings

export const PRODUCT_PAGE_SIZE = 12;

export const AGE_RANGES = [
  "0-2 years",
  "3-5 years",
  "6-8 years",
  "9-12 years",
  "13+ years",
] as const;

export const ORDER_STATUSES = [
  "clicked",
  "confirmed",
  "fulfilled",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
