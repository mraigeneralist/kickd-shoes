"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Lock, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/store/cart";
import { cartTotal, formatINR } from "@/lib/utils";

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

type Address = {
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
};

export default function CheckoutForm({
  userEmail,
  defaultName,
  defaultPhone,
  defaultAddress,
}: {
  userEmail: string;
  defaultName: string;
  defaultPhone: string;
  defaultAddress?: Address;
}) {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const total = cartTotal(items);

  const [form, setForm] = useState({
    name: defaultName,
    phone: defaultPhone,
    line1: defaultAddress?.line1 ?? "",
    line2: defaultAddress?.line2 ?? "",
    city: defaultAddress?.city ?? "",
    state: defaultAddress?.state ?? "",
    pincode: defaultAddress?.pincode ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const ok = await loadRazorpayScript();
      if (!ok) throw new Error("Failed to load payment gateway. Check your connection.");

      // 1. Create the order on the server (recomputes total, validates stock).
      const res = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            size: i.size,
            quantity: i.quantity,
          })),
          shipping: form,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start checkout.");

      // 2. Open Razorpay Checkout.
      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "Kickd",
        description: "Order payment",
        order_id: data.razorpayOrderId,
        prefill: { name: form.name, email: userEmail, contact: form.phone },
        theme: { color: "#E11D2A" },
        handler: async (response: any) => {
          // 3. Verify the payment server-side.
          const verifyRes = await fetch("/api/checkout/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: data.orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyRes.ok && verifyData.ok) {
            clear();
            router.push(`/orders/${verifyData.orderId}?success=1`);
          } else {
            setError("Payment could not be verified. If you were charged, contact support.");
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });

      rzp.on("payment.failed", () => {
        setError("Payment failed. Please try again.");
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong.");
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="container-x flex flex-col items-center justify-center gap-4 py-28 text-center">
        <ShoppingBag size={48} className="text-ink-subtle" />
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <Link href="/products" className="btn-primary mt-2">
          Shop now
        </Link>
      </div>
    );
  }

  return (
    <div className="container-x py-10">
      <h1 className="mb-8 text-4xl font-extrabold tracking-tight">Checkout</h1>
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Shipping form */}
        <form onSubmit={handlePay} className="lg:col-span-2">
          <div className="card p-6">
            <h2 className="text-lg font-bold">Shipping address</h2>
            <p className="mb-5 mt-1 text-xs text-ink-subtle">
              We&apos;ll save this address to your account so you won&apos;t have to
              re-enter it next time.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Full name</label>
                <input className="input" value={form.name} onChange={(e) => update("name", e.target.value)} required />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" value={form.phone} onChange={(e) => update("phone", e.target.value)} required />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Address line 1</label>
                <input className="input" value={form.line1} onChange={(e) => update("line1", e.target.value)} placeholder="House no, street" required />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Address line 2 (optional)</label>
                <input className="input" value={form.line2} onChange={(e) => update("line2", e.target.value)} placeholder="Area, landmark" />
              </div>
              <div>
                <label className="label">City</label>
                <input className="input" value={form.city} onChange={(e) => update("city", e.target.value)} required />
              </div>
              <div>
                <label className="label">State</label>
                <input className="input" value={form.state} onChange={(e) => update("state", e.target.value)} required />
              </div>
              <div>
                <label className="label">PIN code</label>
                <input className="input" value={form.pincode} onChange={(e) => update("pincode", e.target.value)} inputMode="numeric" required />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input bg-neutral-50" value={userEmail} disabled />
              </div>
            </div>

            {error && (
              <p className="mt-4 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">{error}</p>
            )}

            <button type="submit" disabled={loading} className="btn-primary mt-6 w-full">
              <Lock size={16} />
              {loading ? "Processing…" : `Pay ${formatINR(total)}`}
            </button>
            <p className="mt-3 text-center text-xs text-ink-subtle">
              Secured by Razorpay. You won&apos;t be charged until you confirm payment.
            </p>
          </div>
        </form>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-ink/5 bg-neutral-50 p-6">
            <h2 className="text-lg font-bold">Order summary</h2>
            <ul className="mt-4 space-y-3">
              {items.map((i) => (
                <li key={`${i.productId}-${i.size}`} className="flex gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-white">
                    {i.imageUrl && <Image src={i.imageUrl} alt={i.name} fill className="object-cover" sizes="56px" />}
                  </div>
                  <div className="flex flex-1 flex-col text-sm">
                    <span className="font-medium leading-tight">{i.name}</span>
                    <span className="text-ink-muted">Size {i.size} · Qty {i.quantity}</span>
                  </div>
                  <span className="text-sm font-semibold">{formatINR(i.price * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-5 space-y-2 border-t border-ink/10 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Subtotal</dt>
                <dd className="font-medium">{formatINR(total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Shipping</dt>
                <dd className="font-medium text-brand">FREE</dd>
              </div>
              <div className="mt-2 flex justify-between border-t border-ink/10 pt-2 text-base font-bold">
                <dt>Total</dt>
                <dd>{formatINR(total)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
