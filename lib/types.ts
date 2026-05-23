// Shared application types mirroring the Supabase schema (see supabase/schema.sql).

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
};

export type ProductSize = {
  id: string;
  product_id: string;
  size: string;
  stock: number;
};

export type Product = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number; // INR rupees
  image_url: string | null;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
};

export type ProductWithCategory = Product & {
  category: Pick<Category, "id" | "name" | "slug"> | null;
};

export type ProductWithSizes = ProductWithCategory & {
  sizes: ProductSize[];
};

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  is_admin: boolean;
  created_at: string;
};

export type OrderStatus =
  | "pending"
  | "paid"
  | "failed"
  | "shipped"
  | "delivered";

export type Order = {
  id: string;
  user_id: string;
  status: OrderStatus;
  total_amount: number;
  currency: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  shipping_name: string;
  shipping_phone: string;
  shipping_line1: string;
  shipping_line2: string | null;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number;
  size: string;
  quantity: number;
};

export type OrderWithItems = Order & {
  order_items: OrderItem[];
};

// Cart line item as held in the client store / localStorage.
export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  imageUrl: string | null;
  size: string;
  quantity: number;
};
