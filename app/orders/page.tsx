import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/utils";
import type { Order } from "@/lib/types";

export const metadata: Metadata = { title: "My Orders" };

const statusStyles: Record<string, string> = {
  paid: "bg-green-50 text-green-700",
  pending: "bg-amber-50 text-amber-700",
  failed: "bg-brand-50 text-brand-700",
  shipped: "bg-blue-50 text-blue-700",
  delivered: "bg-green-50 text-green-700",
};

export default async function OrdersPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/orders");

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Order[]>();

  return (
    <div className="container-x py-10">
      <h1 className="mb-8 text-4xl font-extrabold tracking-tight">My Orders</h1>

      {!orders || orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <Package size={48} className="text-ink-subtle" />
          <p className="text-lg font-semibold">No orders yet</p>
          <p className="text-ink-muted">When you place an order, it&apos;ll show up here.</p>
          <Link href="/products" className="btn-primary mt-2">
            Start shopping
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/orders/${o.id}`}
                className="flex flex-col gap-3 rounded-2xl border border-ink/5 p-5 transition hover:border-ink/15 hover:shadow-card sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">
                      Order #{o.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyles[o.status] ?? "bg-neutral-100 text-ink-muted"}`}>
                      {o.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">
                    {new Date(o.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold">{formatINR(o.total_amount)}</span>
                  <span className="text-sm font-medium text-brand">View →</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
