import { useMemo, useState } from "react";
import type { Item } from "@/lib/types";
import { ItemCard } from "@/components/ItemCard";
import { ItemDetailsDialog } from "@/components/ItemDetailsDialog";

type Props = {
  items: Item[];
  loading?: boolean;
};

export function ItemGrid({ items, loading }: Props) {
  const [selected, setSelected] = useState<Item | null>(null);
  const [open, setOpen] = useState(false);

  const skeletons = useMemo(() => Array.from({ length: 8 }).map((_, i) => i), []);

  return (
    <div>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {skeletons.map((k) => (
            <div key={k} className="glass h-64 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center opacity-70 py-20">No items match your filters.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((it, index) => (
            <ItemCard
              key={it.id}
              item={it}
              onClick={() => {
                setSelected(it);
                setOpen(true);
              }}
              isFirstRow={index < 4}
            />
          ))}
        </div>
      )}
      <ItemDetailsDialog item={selected} open={open} onOpenChange={setOpen} />
    </div>
  );
}
