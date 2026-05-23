import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRazorpay } from "@/lib/razorpay";
import { toPaise } from "@/lib/utils";

type IncomingItem = { productId: string; size: string; quantity: number };

type ShippingInput = {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
};

export async function POST(request: Request) {
  // 1. Require an authenticated user.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as {
    items: IncomingItem[];
    shipping: ShippingInput;
  };
  const { items, shipping } = body;

  if (!items?.length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }
  for (const f of ["name", "phone", "line1", "city", "state", "pincode"] as const) {
    if (!shipping?.[f]?.trim()) {
      return NextResponse.json(
        { error: `Missing shipping field: ${f}` },
        { status: 400 }
      );
    }
  }

  const admin = createAdminClient();

  // 2. Recompute prices & validate stock from the DB — never trust the client.
  const productIds = Array.from(new Set(items.map((i) => i.productId)));
  const { data: products, error: pErr } = await admin
    .from("products")
    .select("id, name, price, is_active")
    .in("id", productIds);
  if (pErr || !products) {
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }

  const { data: sizes } = await admin
    .from("product_sizes")
    .select("product_id, size, stock")
    .in("product_id", productIds);

  let total = 0;
  const orderItems: {
    product_id: string;
    product_name: string;
    unit_price: number;
    size: string;
    quantity: number;
  }[] = [];

  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product || !product.is_active) {
      return NextResponse.json(
        { error: "A product in your cart is no longer available." },
        { status: 409 }
      );
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }
    const sizeRow = sizes?.find(
      (s) => s.product_id === item.productId && s.size === item.size
    );
    if (!sizeRow || sizeRow.stock < item.quantity) {
      return NextResponse.json(
        { error: `Sorry, "${product.name}" (size ${item.size}) is out of stock.` },
        { status: 409 }
      );
    }
    total += Number(product.price) * item.quantity;
    orderItems.push({
      product_id: product.id,
      product_name: product.name,
      unit_price: Number(product.price),
      size: item.size,
      quantity: item.quantity,
    });
  }

  // 3. Create the Razorpay order (amount in paise).
  let rzpOrder;
  try {
    const razorpay = getRazorpay();
    rzpOrder = await razorpay.orders.create({
      amount: toPaise(total),
      currency: "INR",
      receipt: `kickd_${Date.now()}`,
    });
  } catch (err) {
    console.error("Razorpay order creation failed:", err);
    return NextResponse.json(
      { error: "Could not start payment. Please try again." },
      { status: 502 }
    );
  }

  // 4. Persist a pending order + its items (service role bypasses RLS).
  const { data: order, error: oErr } = await admin
    .from("orders")
    .insert({
      user_id: user.id,
      status: "pending",
      total_amount: total,
      currency: "INR",
      razorpay_order_id: rzpOrder.id,
      shipping_name: shipping.name,
      shipping_phone: shipping.phone,
      shipping_line1: shipping.line1,
      shipping_line2: shipping.line2 || null,
      shipping_city: shipping.city,
      shipping_state: shipping.state,
      shipping_pincode: shipping.pincode,
    })
    .select("id")
    .single();

  if (oErr || !order) {
    console.error("Order insert failed:", oErr);
    return NextResponse.json({ error: "Could not create order" }, { status: 500 });
  }

  const { error: iErr } = await admin
    .from("order_items")
    .insert(orderItems.map((oi) => ({ ...oi, order_id: order.id })));
  if (iErr) {
    console.error("Order items insert failed:", iErr);
    return NextResponse.json({ error: "Could not create order" }, { status: 500 });
  }

  return NextResponse.json({
    orderId: order.id,
    razorpayOrderId: rzpOrder.id,
    amount: rzpOrder.amount,
    currency: rzpOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
}
