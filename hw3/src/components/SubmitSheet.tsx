import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useOrders } from "@/contexts/OrderContext";
import { useState } from "react";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export function SubmitSheet({ open, onOpenChange }: Props) {
  const { items, clear, subtotal } = useCart();
  const { submit } = useOrders();
  const [note, setNote] = useState("");

  const canSubmit = items.length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md glass elev-3">
        <SheetHeader>
          <SheetTitle>Submit Plan</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="text-sm opacity-80">Total: ${subtotal.toFixed(0)}</div>
          <textarea
            placeholder="Add a note (optional)"
            className="w-full min-h-28 rounded-md bg-white/5 border border-white/10 p-2"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <Button
            disabled={!canSubmit}
            className="bg-[color:var(--rose)] text-black hover:brightness-110 rounded-2xl focus-visible:outline-none focus-visible:ring-2 ring-[color:var(--ring)] ring-offset-2 ring-offset-[color:var(--bg)]"
            onClick={() => {
              if (!canSubmit) return;
              submit(items, note || undefined);
              clear();
              setNote(""); // Clear the note after submission
              onOpenChange(false);
            }}
          >
            Submit
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}


