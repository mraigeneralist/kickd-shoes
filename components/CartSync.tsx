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
  // Which user we've already hydrated this session — prevents a second
  // (and doubling) sync when multiple auth events fire for the same user.
  const hydratedUserRef = useRef<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // React to auth state.
  useEffect(() => {
    let active = true;

    // Already-signed-in page load (or token refresh): the DB cart is the
    // source of truth, so replace the local cart with it — never sum.
    async function adoptDbCart(userId: string) {
      const dbItems = await fetchDbCart(supabase);
      if (!active) return;
      userIdRef.current = userId;
      useCart.getState().setItems(dbItems);
      readyRef.current = true;
    }

    // Genuine sign-in: fold the guest's local cart into the saved DB cart
    // once (summing matching lines), then persist the merged result.
    async function mergeOnSignIn(userId: string) {
      const dbItems = await fetchDbCart(supabase);
      if (!active) return;
      userIdRef.current = userId;
      useCart.getState().merge(dbItems);
      readyRef.current = true;
      await persistDbCart(supabase, userId, useCart.getState().items);
    }

    function handle(userId: string, isFreshSignIn: boolean) {
      // Hydrate each user at most once per mount; ignore repeat auth events.
      if (hydratedUserRef.current === userId) return;
      hydratedUserRef.current = userId;
      if (isFreshSignIn) {
        mergeOnSignIn(userId);
      } else {
        adoptDbCart(userId);
      }
    }

    // Initial load: if a session already exists, adopt the DB cart.
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) handle(data.user.id, false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        userIdRef.current = null;
        readyRef.current = false;
        hydratedUserRef.current = null;
        return;
      }
      if (!session?.user) return;
      // Only a real SIGNED_IN should merge the guest cart; INITIAL_SESSION /
      // TOKEN_REFRESHED / USER_UPDATED just adopt what's in the DB.
      handle(session.user.id, event === "SIGNED_IN");
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
