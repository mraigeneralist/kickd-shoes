import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CheckoutForm from "@/components/CheckoutForm";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/checkout");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, phone, shipping_line1, shipping_line2, shipping_city, shipping_state, shipping_pincode"
    )
    .eq("id", user.id)
    .single();

  return (
    <CheckoutForm
      userEmail={user.email ?? ""}
      defaultName={profile?.full_name ?? ""}
      defaultPhone={profile?.phone ?? ""}
      defaultAddress={{
        line1: profile?.shipping_line1 ?? "",
        line2: profile?.shipping_line2 ?? "",
        city: profile?.shipping_city ?? "",
        state: profile?.shipping_state ?? "",
        pincode: profile?.shipping_pincode ?? "",
      }}
    />
  );
}
