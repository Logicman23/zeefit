"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  addLine,
  setLineQty,
  removeLine,
  totals,
  isLine,
  lineKey,
  type CartLine,
} from "./operations";

/**
 * The shopping cart.
 *
 * Lives in the browser, not the database: there are no customer accounts yet, so
 * there is nobody to attach a server-side cart to. localStorage keeps it across
 * reloads and tabs on one device, which is what a guest cart can honestly offer.
 *
 * The maths lives in ./operations.ts — this file is state plus persistence.
 */

export type { CartLine };
export { lineKey };

type CartState = {
  lines: CartLine[];
  /** False until localStorage has been read, so SSR and first paint agree. */
  ready: boolean;
  count: number;
  subtotal: number;
  add: (line: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "zeefit.cart.v1";

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  // Read after mount, never during render: the server has no localStorage, and
  // seeding state from it directly would produce a hydration mismatch.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setLines(parsed.filter(isLine));
      }
    } catch {
      // Corrupt or unavailable storage (private mode, quota) is not fatal —
      // the shopper just starts with an empty cart.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Over quota or blocked: the cart still works for this page view.
    }
  }, [lines, ready]);

  // Another tab changed the cart — keep them in step rather than letting one
  // tab silently overwrite the other on its next write.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY) return;
      try {
        const parsed = e.newValue ? JSON.parse(e.newValue) : [];
        if (Array.isArray(parsed)) setLines(parsed.filter(isLine));
      } catch {
        /* ignore a bad write from elsewhere */
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo<CartState>(() => {
    const { count, subtotal } = totals(lines);
    return {
      lines,
      ready,
      count,
      subtotal,
      add: (line, qty = 1) => setLines((prev) => addLine(prev, line, qty)),
      setQty: (key, qty) => setLines((prev) => setLineQty(prev, key, qty)),
      remove: (key) => setLines((prev) => removeLine(prev, key)),
      clear: () => setLines([]),
    };
  }, [lines, ready]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
