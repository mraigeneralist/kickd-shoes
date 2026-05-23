import Razorpay from "razorpay";
import crypto from "crypto";

/** Server-side Razorpay SDK instance. Uses the secret key — never expose. */
export function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
}

/**
 * Verify the payment signature returned by Razorpay Checkout.
 * Signature = HMAC_SHA256(order_id + "|" + payment_id, key_secret).
 */
export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest("hex");
  // Constant-time comparison.
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(params.signature)
    );
  } catch {
    return false;
  }
}
