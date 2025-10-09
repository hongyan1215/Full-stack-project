import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  orderId: string;
};

export function RequestChangeDialog({ open, onOpenChange, onConfirm, orderId }: Props) {
  const [reason, setReason] = useState("");

  const handleSubmit = () => {
    if (reason.trim()) {
      onConfirm(reason.trim());
      setReason("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60" />
        <Dialog.Content 
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 glass w-[90vw] max-w-md p-6"
          role="dialog"
          aria-labelledby="dialog-title"
        >
          <Dialog.Title id="dialog-title" className="text-lg font-semibold mb-4">
            Request Change
          </Dialog.Title>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="reason" className="block text-sm font-medium mb-2">
                Reason for change
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please explain what you'd like to change..."
                className="w-full h-24 px-3 py-2 bg-[color:var(--glass)]/50 border border-white/10 rounded-2xl text-[color:var(--text)] placeholder-[color:var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent resize-none"
              />
            </div>
            
            <div className="flex gap-3 justify-end">
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="bg-[color:var(--glass)]/60 hover:bg-[color:var(--glass)] border border-white/8 rounded-2xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!reason.trim()}
                className="bg-[color:var(--rose)] text-black hover:brightness-110 rounded-2xl focus-visible:outline-none focus-visible:ring-2 ring-[var(--ring)] ring-offset-2 ring-offset-[var(--bg)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Request
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
