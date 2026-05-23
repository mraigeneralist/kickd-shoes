import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { sendOrderConfirmation } from "@/lib/email";
import type { Order, OrderItem } from "@/lib/types";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const {
    orderId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = (await request.json()) as {
    orderId: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  };

  const admin = createAdminClient();

  // Load the pending order and confirm it belongs to this user.
  const { data: order } = await admin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single<Order>();

  if (!order || order.razorpay_order_id !== razorpay_order_id) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Verify the HMAC signature with the secret key.
  const valid = verifyPaymentSignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!valid) {
    await admin
      .from("orders")
      .update({ status: "failed" })
      .eq("id", orderId);
    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 400 }
    );
  }

  // Mark paid, decrement stock, clear the cart.
  await admin
    .from("orders")
    .update({
      status: "paid",
      razorpay_payment_id,
      razorpay_signature,
    })
    .eq("id", orderId);

  await admin.rpc("decrement_stock", { p_order_id: orderId });
  await admin.from("cart_items").delete().eq("user_id", user.id);

  // Send the confirmation email (best-effort; never blocks success).
  const { data: items } = await admin
    .from("order_items")
    .select("*")
    .eq("order_id", orderId);
  if (user.email) {
    await sendOrderConfirmation(
      user.email,
      { ...order, status: "paid" },
      (items as OrderItem[]) ?? []
    );
  }

  return NextResponse.json({ ok: true, orderId });
}
