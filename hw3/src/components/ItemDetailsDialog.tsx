import * as Dialog from "@radix-ui/react-dialog";
import type { Item } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useState } from "react";

type Props = {
  item: Item | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export function ItemDetailsDialog({ item, open, onOpenChange }: Props) {
  const { add, items, updateQty } = useCart();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  
  const cartItem = item ? items.find(i => i.id === item.id) : null;
  const isInCart = !!cartItem;

  const handleAddToPlan = () => {
    if (item) {
      if (isInCart) {
        updateQty(item.id, cartItem.qty + 1);
      } else {
        add(item);
      }
    }
  };

  const handleQuantityChange = (newQty: number) => {
    if (item && isInCart) {
      updateQty(item.id, newQty);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60" />
        <Dialog.Content 
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 glass w-[95vw] max-w-4xl max-h-[90vh] overflow-auto"
          role="dialog"
          aria-labelledby="dialog-title"
          aria-describedby="dialog-description"
        >
          {item && (
            <div className="grid md:grid-cols-2 gap-6 p-6">
              {/* Image section */}
              <div className="space-y-4">
                <div 
                  className="aspect-[4/3] overflow-hidden rounded-2xl cursor-pointer group"
                  onClick={() => setLightboxOpen(true)}
                  role="button"
                  tabIndex={0}
                  aria-label="View full size image"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setLightboxOpen(true);
                    }
                  }}
                >
                  <img 
                    src={item.image_url} 
                    alt={item.name} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                  />
                </div>
                
                {/* Lightbox */}
                {lightboxOpen && (
                  <div 
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={() => setLightboxOpen(false)}
                    role="button"
                    tabIndex={0}
                    aria-label="Close lightbox"
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setLightboxOpen(false);
                      }
                    }}
                  >
                    <img 
                      src={item.image_url} 
                      alt={item.name} 
                      className="max-w-full max-h-full object-contain"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
              </div>

              {/* Details section */}
              <div className="space-y-4">
                <div>
                  <Dialog.Title id="dialog-title" className="font-display text-3xl text-[color:var(--text)]">
                    {item.name}
                  </Dialog.Title>
                  <div className="mt-2 text-sm text-[color:var(--muted)]">{item.category}</div>
                  <div id="dialog-description" className="mt-4 text-sm text-[color:var(--text)] leading-relaxed">
                    {item.description}
                  </div>
                </div>

                {/* Tags */}
                {item.tags && (
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((t) => (
                      <span key={t} className="px-3 py-1 rounded-full bg-white/5 text-xs text-[color:var(--muted)] border border-white/10">
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Price and actions */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <div className="text-2xl font-semibold text-[color:var(--rose)]">${item.price}</div>
                  
                  {/* Quantity stepper if in cart */}
                  {isInCart && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-[color:var(--muted)]">Quantity:</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleQuantityChange(cartItem.qty - 1)}
                          className="h-8 w-8 rounded-full"
                        >
                          -
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">{cartItem.qty}</span>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleQuantityChange(cartItem.qty + 1)}
                          className="h-8 w-8 rounded-full"
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Action button */}
                  <div className="flex">
                    <Button
                      className="w-full bg-[color:var(--rose)] text-black hover:brightness-110 rounded-2xl focus-visible:outline-none focus-visible:ring-2 ring-[var(--ring)] ring-offset-2 ring-offset-[var(--bg)]"
                      onClick={handleAddToPlan}
                    >
                      {isInCart ? 'Add More' : 'Add to Plan'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}