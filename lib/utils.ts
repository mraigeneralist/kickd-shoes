import type { CartItem } from "./types";

/** Format an INR rupee amount, e.g. 4999 -> "₹4,999". */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Sum of all cart line items in rupees. */
export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

/** Total number of units across the cart. */
export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

/** Tailwind class merge helper (lightweight). */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** Convert rupees to paise for Razorpay (which charges in the smallest unit). */
export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/** Turn a product name into a URL-safe slug, e.g. "Kickd Aero Low" -> "kickd-aero-low". */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** The standard UK size run seeded for every Kickd product. */
export const DEFAULT_SIZES = [
  "UK 6",
  "UK 7",
  "UK 8",
  "UK 9",
  "UK 10",
  "UK 11",
  "UK 12",
];
