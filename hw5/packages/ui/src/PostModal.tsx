"use client";

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { computeVisibleCharCount } from "@utils/shared";
import { DiscardConfirmDialog } from "./DiscardConfirmDialog";
import { DraftListModal } from "./DraftListModal";
import { useRouter } from "next/navigation";

interface PostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialText?: string;
  userImage?: string | null;
}

export function PostModal({ open, onOpenChange, initialText = "", userImage }: PostModalProps) {
  const [text, setText] = useState(initialText);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [showDraftList, setShowDraftList] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setText(initialText);
      setError("");
    }
  }, [open, initialText]);

  const charCount = computeVisibleCharCount(text);
  const remaining = 280 - charCount.visibleCount;
  const hasContent = text.trim().length > 0;
  const canPost = hasContent && charCount.visibleCount <= 280 && !loading;

  const handleClose = (force = false) => {
    if (force || !hasContent) {
      setText("");
      setShowDiscardDialog(false);
      onOpenChange(false);
      return;
    }

    // Show discard dialog if there's content
    setShowDiscardDialog(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      handleClose();
    } else {
      onOpenChange(open);
    }
  };

  const handleSaveDraft = async () => {
    if (!text.trim()) {
      setShowDiscardDialog(false);
      onOpenChange(false);
      return;
    }

    setSavingDraft(true);
    try {
      const res = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        throw new Error("Failed to save draft");
      }

      setShowDiscardDialog(false);
      setText("");
      onOpenChange(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save draft");
    } finally {
      setSavingDraft(false);
    }
  };

  const handleDiscard = () => {
    setShowDiscardDialog(false);
    setText("");
    onOpenChange(false);
  };

  const handlePost = async () => {
    if (!canPost) return;

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const data = await res.text();
        throw new Error(data || "Failed to post");
      }

      setText("");
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDraft = (draft: { text: string }) => {
    setText(draft.text);
    setShowDraftList(false);
    // Keep main modal open when selecting a draft
  };

  return (
    <>
      <Dialog.Root open={open} onOpenChange={handleDialogOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-black border border-x-border overflow-hidden flex flex-col max-h-[90vh]">
            <Dialog.Title className="sr-only">Create a new post</Dialog.Title>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-x-border">
              <button
                onClick={() => handleClose()}
                className="rounded-full p-2 hover:bg-x-hover text-x-text transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <button
                onClick={() => setShowDraftList(true)}
                className="text-primary hover:underline text-sm font-medium"
              >
                Drafts
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {userImage ? (
                    <img
                      src={userImage}
                      alt="User"
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-x-border" />
                  )}
                </div>

                {/* Text area */}
                <div className="flex-1 min-w-0">
                  <textarea
                    value={text}
                    onChange={(e) => {
                      const newText = e.target.value;
                      const newCount = computeVisibleCharCount(newText);
                      // Always allow if visible count is within limit
                      // Also allow if user is deleting (text getting shorter)
                      if (newCount.visibleCount <= 280 || newText.length <= text.length) {
                        setText(newText);
                      }
                    }}
                    placeholder="What's happening?"
                    className="w-full resize-none bg-transparent text-xl text-x-text placeholder-x-textSecondary focus:outline-none min-h-[120px]"
                    rows={6}
                    disabled={loading}
                  />

                  {error && (
                    <div className="mt-3 rounded-md bg-red-500/10 p-2 text-sm text-red-500">
                      {error}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-x-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm ${
                      remaining < 0
                        ? "text-red-500"
                        : remaining < 20
                        ? "text-yellow-500"
                        : "text-x-textSecondary"
                    }`}
                  >
                    {remaining < 20 ? remaining : ""}
                  </span>
                </div>

                <button
                  onClick={handlePost}
                  disabled={!canPost}
                  className="rounded-full bg-primary px-6 py-2 font-bold text-white transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Posting..." : "Post"}
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <DiscardConfirmDialog
        open={showDiscardDialog}
        onOpenChange={setShowDiscardDialog}
        onSave={handleSaveDraft}
        onDiscard={handleDiscard}
        saving={savingDraft}
      />

      <DraftListModal
        open={showDraftList}
        onOpenChange={setShowDraftList}
        onSelectDraft={handleSelectDraft}
      />
    </>
  );
}

