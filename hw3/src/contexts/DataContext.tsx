import { createContext, useContext } from "react";
import type { Item } from "@/lib/types";
import { useCsvData } from "@/hooks/useCsvData";

type DataContextValue = {
  items: Item[];
  loading: boolean;
  error: string | null;
};

const DataContext = createContext<DataContextValue>({ items: [], loading: false, error: null });

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { items, loading, error } = useCsvData();
  return <DataContext.Provider value={{ items, loading, error }}>{children}</DataContext.Provider>;
}

export function useData() {
  return useContext(DataContext);
}


