import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem, Order } from "@/lib/types";

type OrderContextValue = {
  orders: Order[];
  submit: (cart: CartItem[], note?: string) => Order;
  listOrders: () => Order[];
  markChangeRequested: (orderId: string, reason?: string) => void;
};

const STORAGE_KEY = "orders:v1";

const OrderContext = createContext<OrderContextValue | undefined>(undefined);

function generateId() {
  return `ord_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Order[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch {
      // ignore
    }
  }, [orders]);

  const submit = useCallback((cart: CartItem[], note?: string) => {
    const total = cart.reduce((acc, it) => acc + it.qty * it.price, 0);
    const order: Order = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      items: cart,
      total,
      note,
      status: "submitted",
    };
    setOrders((prev) => [order, ...prev]);
    return order;
  }, []);

  const listOrders = useCallback(() => orders, [orders]);

  const markChangeRequested = useCallback((orderId: string, reason?: string) => {
    setOrders((prev) => prev.map((o) => 
      o.id === orderId 
        ? { 
            ...o, 
            status: "change-requested" as const,
            meta: { ...o.meta, changeReason: reason }
          } 
        : o
    ));
  }, []);

  const value = useMemo(
    () => ({ orders, submit, listOrders, markChangeRequested }),
    [orders, submit, listOrders, markChangeRequested]
  );

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrders must be used within OrderProvider");
  return ctx;
}


