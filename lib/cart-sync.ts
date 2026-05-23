import type { SupabaseClient } from "@supabase/supabase-js";
import type { CartItem } from "./types";

/** Load a logged-in user's cart from the DB, joined with product details. */
export async function fetchDbCart(
  supabase: SupabaseClient
): Promise<CartItem[]> {
  const { data, error } = await supabase
    .from("cart_items")
    .select(
      "quantity, size, product:products(id, slug, name, price, image_url)"
    );
  if (error || !data) return [];

  return data
    .filter((row: any) => row.product)
    .map((row: any) => ({
      productId: row.product.id,
      slug: row.product.slug,
      name: row.product.name,
      price: row.product.price,
      imageUrl: row.product.image_url,
      size: row.size,
      quantity: row.quantity,
    }));
}

/**
 * Replace the user's DB cart with the given items. Simple and race-free for a
 * single-user cart: clear, then insert the current set.
 */
export async function persistDbCart(
  supabase: SupabaseClient,
  userId: string,
  items: CartItem[]
): Promise<void> {
  await supabase.from("cart_items").delete().eq("user_id", userId);
  if (items.length === 0) return;
  await supabase.from("cart_items").insert(
    items.map((i) => ({
      user_id: userId,
      product_id: i.productId,
      size: i.size,
      quantity: i.quantity,
    }))
  );
}
