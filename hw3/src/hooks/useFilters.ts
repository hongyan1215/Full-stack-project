import { useMemo, useState } from "react";
import type { Item } from "@/lib/types";

export type SortBy = "relevance" | "price-asc" | "price-desc" | "rating-desc";

export function useFilters(items: Item[]) {
  const [keyword, setKeyword] = useState<string>("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [sortBy, setSortBy] = useState<SortBy>("relevance");

  const filteredItems = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    let results = items.filter((it) => {
      const inCategory =
        selectedCategories.length === 0 || selectedCategories.includes(it.category);
      const inPrice = it.price >= priceRange[0] && it.price <= priceRange[1];
      const inKw =
        kw.length === 0 ||
        it.name.toLowerCase().includes(kw) ||
        (it.description || "").toLowerCase().includes(kw) ||
        (it.tags || []).some((t) => t.toLowerCase().includes(kw));
      return inCategory && inPrice && inKw;
    });

    switch (sortBy) {
      case "price-asc":
        results = [...results].sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        results = [...results].sort((a, b) => b.price - a.price);
        break;
      case "rating-desc":
        results = [...results].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "relevance":
      default:
        break;
    }

    return results;
  }, [items, keyword, selectedCategories, priceRange, sortBy]);

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const reset = () => {
    setKeyword("");
    setSelectedCategories([]);
    setPriceRange([0, 100000]);
    setSortBy("relevance");
  };

  return {
    keyword,
    setKeyword,
    selectedCategories,
    toggleCategory,
    priceRange,
    setPriceRange,
    sortBy,
    setSortBy,
    filteredItems,
    reset,
  };
}


