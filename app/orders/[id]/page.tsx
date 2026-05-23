import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/utils";
import type { OrderWithItems } from "@/lib/types";

export const metadata: Metadata = { title: "Order details" };

const statusStyles: Record<string, string> = {
  paid: "bg-green-50 text-green-700",
  pending: "bg-amber-50 text-amber-700",
  failed: "bg-brand-50 text-brand-700",
  shipped: "bg-blue-50 text-blue-700",
  delivered: "bg-green-50 text-green-700",
};

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { success?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/orders/${params.id}`);

  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", params.id)
    .single<OrderWithItems>();

  if (!order) notFound();

  const justPaid = searchParams.success === "1";

  return (
    <div className="container-x max-w-3xl py-10">
      {justPaid && (
        <div className="mb-8 flex items-center gap-3 rounded-2xl bg-green-50 p-5 text-green-800">
          <CheckCircle2 size={28} className="shrink-0" />
          <div>
            <p className="font-bold">Payment successful — thank you!</p>
            <p className="text-sm">A confirmation email is on its way to you.</p>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/orders" className="text-sm text-ink-muted hover:text-brand">
            ← All orders
          </Link>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Placed on{" "}
            {new Date(order.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold capitalize ${statusStyles[order.status] ?? "bg-neutral-100 text-ink-muted"}`}>
          {order.status}
        </span>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Items */}
        <div className="card p-6 sm:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 font-bold">
            <Package size={18} className="text-brand" /> Items
          </h2>
          <ul className="divide-y divide-ink/5">
            {order.order_items.map((it) => (
              <li key={it.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium">{it.product_name}</p>
                  <p className="text-ink-muted">Size {it.size} · Qty {it.quantity}</p>
                </div>
                <span className="font-semibold">{formatINR(it.unit_price * it.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-4">
            <span className="font-bold">Total paid</span>
            <span className="text-lg font-bold">{formatINR(order.total_amount)}</span>
          </div>
        </div>

        {/* Shipping */}
        <div className="card p-6 sm:col-span-2">
          <h2 className="mb-3 font-bold">Shipping to</h2>
          <address className="text-sm not-italic leading-relaxed text-ink-muted">
            <span className="font-medium text-ink">{order.shipping_name}</span><br />
            {order.shipping_line1}
            {order.shipping_line2 ? `, ${order.shipping_line2}` : ""}<br />
            {order.shipping_city}, {order.shipping_state} {order.shipping_pincode}<br />
            {order.shipping_phone}
          </address>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link href="/products" className="btn-outline">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
