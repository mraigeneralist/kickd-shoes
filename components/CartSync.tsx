"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchDbCart, persistDbCart } from "@/lib/cart-sync";
import { useCart } from "@/lib/store/cart";

/**
 * Keeps the cart in sync with Supabase for logged-in users:
 *  - On sign-in: merge the DB cart into the local cart, then push the merged
 *    set back so it's consistent across devices.
 *  - On any local cart change while signed in: mirror it to the DB (debounced).
 * Guests keep using localStorage only (via the zustand persist middleware).
 */
export default function CartSync() {
  const supabase = createClient();
  const userIdRef = useRef<string | null>(null);
  const readyRef = useRef(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // React to auth state.
  useEffect(() => {
    let active = true;

    async function hydrate(userId: string | null) {
      userIdRef.current = userId;
      if (!userId) {
        readyRef.current = false;
        return;
      }
      const dbItems = await fetchDbCart(supabase);
      if (!active) return;
      useCart.getState().merge(dbItems);
      await persistDbCart(supabase, userId, useCart.getState().items);
      readyRef.current = true;
    }

    supabase.auth.getUser().then(({ data }) => hydrate(data.user?.id ?? null));

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        userIdRef.current = null;
        readyRef.current = false;
      } else if (session?.user) {
        hydrate(session.user.id);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mirror local cart changes to the DB.
  useEffect(() => {
    const unsub = useCart.subscribe((state, prev) => {
      // Only mirror when the items actually changed (ignore drawer open/close).
      if (state.items === prev.items) return;
      const userId = userIdRef.current;
      if (!userId || !readyRef.current) return;
      if (debounce.current) clearTimeout(debounce.current);
      debounce.current = setTimeout(() => {
        persistDbCart(supabase, userId, state.items);
      }, 600);
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
