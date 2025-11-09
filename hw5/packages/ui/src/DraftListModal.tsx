"use client";

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Draft {
  id: string;
  text: string;
  updatedAt: Date | string;
}

interface DraftListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectDraft: (draft: Draft) => void;
}

export function DraftListModal({
  open,
  onOpenChange,
  onSelectDraft,
}: DraftListModalProps) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      fetchDrafts();
    }
  }, [open]);

  const fetchDrafts = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/drafts");
      if (!res.ok) throw new Error("Failed to fetch drafts");
      const data = await res.json();
      setDrafts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch drafts");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this draft?")) return;

    try {
      const res = await fetch(`/api/drafts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete draft");
      setDrafts(drafts.filter((d) => d.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete draft");
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl max-h-[80vh] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-black border border-x-border overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-x-border">
            <Dialog.Title className="text-xl font-bold text-x-text">
              Drafts
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-full p-2 hover:bg-x-hover text-x-text">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-x-textSecondary">Loading...</div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">{error}</div>
            ) : drafts.length === 0 ? (
              <div className="p-8 text-center text-x-textSecondary">No drafts yet</div>
            ) : (
              <div className="divide-y divide-x-border">
                {drafts.map((draft) => {
                  const updatedAt = typeof draft.updatedAt === "string" 
                    ? new Date(draft.updatedAt) 
                    : draft.updatedAt;
                  const timeAgo = formatDistanceToNow(updatedAt, { addSuffix: true });

                  return (
                    <div
                      key={draft.id}
                      onClick={() => {
                        onSelectDraft(draft);
                        onOpenChange(false);
                      }}
                      className="p-4 hover:bg-x-hover cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-x-text whitespace-pre-wrap break-words">
                            {draft.text || "(Empty draft)"}
                          </p>
                          <p className="text-sm text-x-textSecondary mt-2">{timeAgo}</p>
                        </div>
                        <button
                          onClick={(e) => handleDelete(draft.id, e)}
                          className="flex-shrink-0 p-2 rounded-full hover:bg-red-500/10 text-x-textSecondary hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

