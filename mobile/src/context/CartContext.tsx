import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

import { Orders } from "../api/endpoints";
import { Cart } from "../types";
import { useAuth } from "./AuthContext";

interface CartState {
  cart: Cart | null;
  count: number;
  loading: boolean;
  refresh: () => Promise<void>;
  add: (partId: number, qty?: number) => Promise<void>;
  setQty: (itemId: number, qty: number) => Promise<void>;
  remove: (itemId: number) => Promise<void>;
  clearLocal: () => void;
}

const CartContext = createContext<CartState>({} as CartState);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setCart(null);
      return;
    }
    setLoading(true);
    try {
      const { data } = await Orders.cart();
      setCart(data);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function add(partId: number, qty = 1) {
    const { data } = await Orders.addToCart(partId, qty);
    setCart(data);
  }
  async function setQty(itemId: number, qty: number) {
    const { data } = await Orders.updateCartItem(itemId, qty);
    setCart(data);
  }
  async function remove(itemId: number) {
    const { data } = await Orders.removeCartItem(itemId);
    setCart(data);
  }
  function clearLocal() {
    setCart((c) => (c ? { ...c, items: [], item_count: 0, subtotal: "0" } : c));
  }

  return (
    <CartContext.Provider
      value={{ cart, count: cart?.item_count ?? 0, loading, refresh, add, setQty, remove, clearLocal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
