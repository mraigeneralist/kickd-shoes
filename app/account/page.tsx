import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/utils";
import type { Order, Profile } from "@/lib/types";
import ProfileForm from "@/components/ProfileForm";

export const metadata: Metadata = { title: "My Account" };

const statusStyles: Record<string, string> = {
  paid: "bg-green-50 text-green-700",
  pending: "bg-amber-50 text-amber-700",
  failed: "bg-brand-50 text-brand-700",
  shipped: "bg-blue-50 text-blue-700",
  delivered: "bg-green-50 text-green-700",
};

export default async function AccountPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/account");

  const [{ data: profile }, { data: orders }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "full_name, phone, shipping_line1, shipping_line2, shipping_city, shipping_state, shipping_pincode"
      )
      .eq("id", user.id)
      .single<Partial<Profile>>(),
    supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(3)
      .returns<Order[]>(),
  ]);

  return (
    <div className="container-x py-10">
      <h1 className="mb-8 text-4xl font-extrabold tracking-tight">My Account</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Profile + address */}
        <div className="lg:col-span-2">
          <ProfileForm
            userId={user.id}
            userEmail={user.email ?? ""}
            initial={{
              full_name: profile?.full_name ?? "",
              phone: profile?.phone ?? "",
              shipping_line1: profile?.shipping_line1 ?? "",
              shipping_line2: profile?.shipping_line2 ?? "",
              shipping_city: profile?.shipping_city ?? "",
              shipping_state: profile?.shipping_state ?? "",
              shipping_pincode: profile?.shipping_pincode ?? "",
            }}
          />
        </div>

        {/* Recent orders */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-ink/5 bg-neutral-50 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Recent orders</h2>
              <Link
                href="/orders"
                className="text-sm font-medium text-brand hover:underline"
              >
                View all
              </Link>
            </div>

            {!orders || orders.length === 0 ? (
              <div className="mt-6 flex flex-col items-center gap-3 py-6 text-center">
                <Package size={36} className="text-ink-subtle" />
                <p className="text-sm text-ink-muted">No orders yet.</p>
                <Link href="/products" className="btn-primary mt-1">
                  Start shopping
                </Link>
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {orders.map((o) => (
                  <li key={o.id}>
                    <Link
                      href={`/orders/${o.id}`}
                      className="flex items-center justify-between gap-2 rounded-xl border border-ink/5 bg-white p-3 transition hover:border-ink/15"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold">
                            #{o.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${statusStyles[o.status] ?? "bg-neutral-100 text-ink-muted"}`}
                          >
                            {o.status}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-ink-muted">
                          {new Date(o.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}{" "}
                          · {formatINR(o.total_amount)}
                        </p>
                      </div>
                      <ChevronRight size={18} className="shrink-0 text-ink-subtle" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
