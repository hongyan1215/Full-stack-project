import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";

export type Category = {
  id: string;
  display_name: string;
  icon?: string;
};

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const url = "/data/categories.csv";
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch ${url}`);
        const text = await res.text();
        const parsed = Papa.parse<Record<string, string>>(text, {
          header: true,
          skipEmptyLines: true,
        });
        const data: Category[] = (parsed.data || [])
          .map((r) => ({
            id: (r.id || "").trim(),
            display_name: (r.display_name || r.id || "").trim(),
            icon: r.icon?.trim() || undefined,
          }))
          .filter((c) => c.id);
        if (!cancelled) setCategories(data);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => ({ categories, loading, error }), [categories, loading, error]);
}


