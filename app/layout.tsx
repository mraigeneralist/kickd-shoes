import type { Metadata } from "next";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import CartSync from "@/components/CartSync";

export const metadata: Metadata = {
  title: {
    default: "Kickd — Step Up Your Game",
    template: "%s · Kickd",
  },
  description:
    "Kickd — premium sneakers, running shoes, and boots. Clean design, fast shipping across India.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    isAdmin = !!profile?.is_admin;
  }

  return (
    <html lang="en">
      <body>
        <CartSync />
        <div className="flex min-h-screen flex-col">
          <Navbar userEmail={user?.email ?? null} isAdmin={isAdmin} />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <CartDrawer />
      </body>
    </html>
  );
}
