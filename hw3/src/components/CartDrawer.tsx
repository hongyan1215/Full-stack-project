import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, X } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onProceed?: () => void;
};

export function CartDrawer({ open, onOpenChange, onProceed }: Props) {
  const { items, remove, updateQty, subtotal, clear } = useCart();
  const { toast } = useToast();
  const canProceed = items.length > 0;

  const handleRemove = (item: typeof items[0]) => {
    remove(item.id);
    toast({
      title: "Removed",
      description: `${item.name} removed from plan`,
      duration: 1000,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[480px] glass elev-3 flex flex-col">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl">Today's Plan</SheetTitle>
          <div className="text-sm text-[color:var(--muted)]">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </div>
        </SheetHeader>
        
        <Separator className="opacity-20" />
        
        <div className="flex-1 overflow-y-auto py-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-sm text-[color:var(--muted)] mb-4">Your planned desserts will appear here.</div>
              <Button
                variant="ghost"
                className="bg-[color:var(--glass)]/60 hover:bg-[color:var(--glass)] border border-white/8 rounded-2xl"
                onClick={() => onOpenChange(false)}
              >
                Continue browsing
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((it) => (
                <div key={it.id} className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 flex-shrink-0">
                    {it.image_url && (
                      <img 
                        src={it.image_url} 
                        alt={it.name} 
                        className="w-full h-full object-cover rounded-xl" 
                      />
                    )}
                  </div>
                  
                  {/* Item details */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[color:var(--text)] truncate">{it.name}</div>
                    <div className="text-xs text-[color:var(--muted)]">${it.price} each</div>
                  </div>
                  
                  {/* Quantity stepper */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => updateQty(it.id, it.qty - 1)}
                      className="h-8 w-8 rounded-full p-0"
                    >
                      <Minus size={14} />
                    </Button>
                    <div className="w-8 text-center text-sm font-medium">{it.qty}</div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => updateQty(it.id, it.qty + 1)}
                      className="h-8 w-8 rounded-full p-0"
                    >
                      <Plus size={14} />
                    </Button>
                  </div>
                  
                  {/* Line total */}
                  <div className="text-right min-w-0">
                    <div className="text-sm font-semibold text-[color:var(--text)]">
                      ${(it.price * it.qty).toFixed(0)}
                    </div>
                  </div>
                  
                  {/* Remove button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(it)}
                    className="h-8 w-8 rounded-full p-0 text-[color:var(--muted)] hover:text-red-400"
                  >
                    <X size={14} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {items.length > 0 && (
          <>
            <Separator className="opacity-20" />
            <div className="pt-4 space-y-4">
              {/* Subtotal */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-[color:var(--muted)]">Subtotal</div>
                <div className="text-lg font-bold text-[color:var(--text)]">${subtotal.toFixed(0)}</div>
              </div>
              
              {/* Helper text */}
              <div className="text-xs text-[color:var(--muted)] text-center">
                Taxes and fees calculated at checkout
              </div>
              
              {/* Action buttons */}
              <div className="space-y-3">
                <Button
                  className="w-full bg-[color:var(--rose)] text-black hover:brightness-110 rounded-2xl focus-visible:outline-none focus-visible:ring-2 ring-[var(--ring)] ring-offset-2 ring-offset-[var(--bg)]"
                  onClick={() => { onOpenChange(false); onProceed?.(); }}
                >
                  Proceed to Submit
                </Button>
                <Button
                  variant="ghost"
                  className="w-full bg-[color:var(--glass)]/60 hover:bg-[color:var(--glass)] border border-white/8 rounded-2xl"
                  onClick={() => onOpenChange(false)}
                >
                  Continue browsing
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}


