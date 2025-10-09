import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import type { Item } from "@/lib/types";

type UseCsvDataResult = {
  items: Item[];
  loading: boolean;
  error: string | null;
};

function coerceItem(raw: Record<string, string>): Item | null {
  const id = raw.id?.trim();
  const name = raw.name?.trim();
  const category = raw.category?.trim() || "";
  if (!id || !name) return null;

  const price = Number.parseFloat(raw.price ?? "0");
  const ratingRaw = raw.rating ? Number.parseFloat(raw.rating) : undefined;
  const rating = ratingRaw === undefined ? undefined : Math.max(0, Math.min(5, ratingRaw));
  const stock = raw.stock ? Number.parseInt(raw.stock) : undefined;
  const tags = raw.tags?.split(",").map((t) => t.trim()).filter(Boolean);

  return {
    id,
    name,
    category,
    price: Number.isFinite(price) ? price : 0,
    description: raw.description?.trim() || undefined,
    image_url: raw.image_url?.trim() || undefined,
    tags: tags && tags.length ? tags : undefined,
    rating,
    stock: Number.isFinite(stock as number) ? stock : undefined,
    location: raw.location?.trim() || undefined,
    opening_hours: raw.opening_hours?.trim() || undefined,
  };
}

export function useCsvData(): UseCsvDataResult {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const itemsCsvUrl = "/data/items.csv";
        const response = await fetch(itemsCsvUrl);
        if (!response.ok) throw new Error(`Failed to fetch ${itemsCsvUrl}`);
        const csvText = await response.text();

        const parsed = Papa.parse<Record<string, string>>(csvText, {
          header: true,
          skipEmptyLines: true,
        });
        if (parsed.errors?.length) {
          // Keep parsing result but surface the first error message
          console.warn("Papa.parse errors", parsed.errors);
        }
        const coerced = (parsed.data || [])
          .map(coerceItem)
          .filter((v): v is Item => Boolean(v));

        if (!cancelled) setItems(coerced);

        // Best-effort fetch optional categories file to warm the cache for later use
        // This does not affect the return value of this hook.
        fetch("/data/categories.csv").catch(() => undefined);
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

  return useMemo(() => ({ items, loading, error }), [items, loading, error]);
}


