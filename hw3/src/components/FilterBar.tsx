import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useCategories } from "@/hooks/useCategories";
import { Cookie, Cake, Coffee, Circle, PieChart, IceCream } from "lucide-react";
import type { SortBy } from "@/hooks/useFilters";
import { Button } from "@/components/ui/button";

type Props = {
  keyword: string;
  onKeyword: (v: string) => void;
  selectedCategories: string[];
  onToggleCategory: (id: string) => void;
  sortBy: SortBy;
  onSortBy: (s: SortBy) => void;
  onClearAll?: () => void;
};

export function FilterBar({
  keyword,
  onKeyword,
  selectedCategories,
  onToggleCategory,
  sortBy,
  onSortBy,
  onClearAll,
}: Props) {
  const { categories } = useCategories();

  return (
    <div className="glass p-4 elev-2 border border-white/6 rounded-2xl" role="group" aria-label="Filters">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <Input
          placeholder="Search desserts, cafés, tags..."
          aria-label="Search menu"
          value={keyword}
          onChange={(e) => onKeyword(e.target.value)}
          className="h-9 rounded-2xl bg-[color:var(--glass)]/90 border border-white/12 text-[color:var(--text)] placeholder:text-[color:var(--muted)] focus-visible:ring-2 ring-[var(--ring)] ring-offset-2 ring-offset-[var(--bg)]"
        />
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-sm">
          <label className="opacity-80" htmlFor="sort-select">Sort</label>
          <select
            className="bg-[color:var(--glass)]/80 border border-white/12 rounded-2xl px-2 py-1 h-9 focus-visible:ring-2 ring-[var(--ring)] ring-offset-2 ring-offset-[var(--bg)]"
            id="sort-select"
            value={sortBy}
            onChange={(e) => onSortBy(e.target.value as SortBy)}
          >
            <option value="relevance">Relevance</option>
            <option value="price-asc">Price ↑</option>
            <option value="price-desc">Price ↓</option>
            <option value="rating-desc">Rating</option>
          </select>
          <Button
            variant="ghost"
            className="ml-2 bg-[color:var(--glass)]/85 hover:bg-[color:var(--glass)]/95 border border-white/20 text-[color:var(--text)] rounded-2xl h-9 focus-visible:ring-2 ring-[var(--ring)] ring-offset-2 ring-offset-[var(--bg)]"
            onClick={onClearAll}
          >
            Clear All
          </Button>
        </div>
      </div>
      <Separator className="my-4 opacity-20" />
      <div className="flex flex-wrap gap-2" role="listbox" aria-label="Categories">
        {categories.map((c) => {
          const active = selectedCategories.includes(c.id);
          const Icon =
            c.icon === 'Cookie' ? Cookie :
            c.icon === 'Cake' ? Cake :
            c.icon === 'Coffee' ? Coffee :
            c.icon === 'Circle' ? Circle :
            c.icon === 'PieChart' ? PieChart :
            IceCream;
          return (
            <button
              key={c.id}
              onClick={() => onToggleCategory(c.id)}
              className={
                "px-3 h-8 inline-flex items-center gap-1 rounded-2xl text-sm transition select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] " +
                (active
                  ? "bg-white/10 border border-white/10"
                  : "bg-white/5 border border-white/10 hover:bg-white/15")
              }
              role="option"
              aria-selected={active}
              aria-label={`Filter by ${c.display_name} category`}
            >
              <span className="inline-flex items-center gap-1">
                <Icon size={14} className={active ? "text-rose" : "opacity-80"} />
                {c.display_name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}


