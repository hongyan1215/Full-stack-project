"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

interface DiscardConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  onDiscard: () => void;
  saving?: boolean;
}

export function DiscardConfirmDialog({
  open,
  onOpenChange,
  onSave,
  onDiscard,
  saving = false,
}: DiscardConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-black border border-x-border p-6">
          <Dialog.Title className="text-xl font-bold text-x-text mb-2">
            Save draft?
          </Dialog.Title>
          <Dialog.Description className="text-x-textSecondary mb-6">
            You have unsaved changes. Would you like to save this as a draft or discard it?
          </Dialog.Description>

          <div className="flex gap-3 justify-end">
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-full border border-x-border px-4 py-2 font-bold text-x-text hover:bg-x-hover"
              >
                Cancel
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={onDiscard}
              className="rounded-full border border-red-500 px-4 py-2 font-bold text-red-500 hover:bg-red-500/10"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="rounded-full bg-x-text px-4 py-2 font-bold text-black hover:bg-x-textSecondary disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

