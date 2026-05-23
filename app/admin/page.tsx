import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminDashboard from "@/components/admin/AdminDashboard";
import type { Category, ProductWithSizes } from "@/lib/types";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return (
      <div className="container-x py-28 text-center">
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="mt-2 text-ink-muted">
          This page is for store admins only. Ask the owner to grant your account
          admin access (see SETUP.md).
        </p>
      </div>
    );
  }

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase
      .from("products")
      .select("*, category:categories(id, name, slug), sizes:product_sizes(*)")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <AdminDashboard
      categories={(categories as Category[]) ?? []}
      products={(products as ProductWithSizes[]) ?? []}
    />
  );
}
