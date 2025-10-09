import { motion } from "framer-motion";
import type { Item } from "@/lib/types";

type Props = {
  item: Item;
  onClick: () => void;
  isFirstRow?: boolean;
};

export function ItemCard({ item, onClick, isFirstRow = false }: Props) {
  const isLowStock = (item.stock || 0) < 10;
  const isOutOfStock = (item.stock || 0) === 0;
  const displayTags = item.tags?.slice(0, 3) || [];
  const remainingTags = (item.tags?.length || 0) - 3;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative overflow-hidden text-left rounded-2xl shadow-soft border border-white/10 card-glow group ${isOutOfStock ? 'opacity-70 grayscale-[70%]' : ''}`}
      aria-label={`View details for ${item.name}`}
      tabIndex={0}
    >
        <div className="aspect-[4/3] overflow-hidden relative bg-black">
          <img
            src={item.image_url}
            alt={item.name}
            width={400}
            height={300}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading={isFirstRow ? "eager" : "lazy"}
            fetchPriority={isFirstRow ? "high" : "auto"}
            decoding="async"
            style={{ objectPosition: 'center' }}
          />
        {/* High contrast gradient overlay for better text readability */}
        <div className="absolute inset-0 overlay-high-contrast" />
        
        {/* Price badge */}
        <div className="absolute top-3 right-3 rounded-full px-3 py-1 bg-black/80 backdrop-blur text-[13px] font-medium text-white group-hover:bg-[color:var(--rose)] group-hover:text-black transition-colors shadow-lg">
          ${item.price}
        </div>
        
        {/* Low stock indicator */}
        {isLowStock && !isOutOfStock && (
          <div className="absolute top-3 left-3 rounded-full px-2 py-1 bg-orange-500/80 backdrop-blur text-[11px] font-medium text-white">
            Low
          </div>
        )}
      </div>
      <div className="p-4">
        {/* Title with line clamp */}
        <h3 className="font-medium text-[color:var(--text)] line-clamp-2 leading-tight">{item.name}</h3>
        <div className="mt-1 text-xs text-[color:var(--muted)]">{item.category}</div>
        
        {/* Tags with overflow indicator */}
        {displayTags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {displayTags.map((t) => (
              <span key={t} className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-[color:var(--muted)]">
                {t}
              </span>
            ))}
            {remainingTags > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-[color:var(--muted)]">
                +{remainingTags}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.button>
  );
}