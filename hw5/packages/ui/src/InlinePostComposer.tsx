"use client";

import { useState } from "react";
import { computeVisibleCharCount } from "@utils/shared";
import { useRouter } from "next/navigation";

interface InlinePostComposerProps {
  onSuccess?: () => void;
  placeholder?: string;
  parentId?: string;
  userImage?: string | null;
  currentUserId?: string;
}

export function InlinePostComposer({
  onSuccess,
  placeholder = "What's happening?",
  parentId,
  userImage,
  currentUserId,
}: InlinePostComposerProps) {
  const [text, setText] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const charCount = computeVisibleCharCount(text);
  const remaining = 280 - charCount.visibleCount;
  const canPost = text.trim().length > 0 && charCount.visibleCount <= 280 && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPost) return;

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, parentId }),
      });

      if (!res.ok) {
        const data = await res.text();
        throw new Error(data || "Failed to post");
      }

      setText("");
      setExpanded(false);
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post");
    } finally {
      setLoading(false);
    }
  };

  if (!expanded) {
    return (
      <div
        onClick={() => {
          if (currentUserId) {
            setExpanded(true);
          } else {
            router.push("/api/auth/signin");
          }
        }}
        className="border-b border-x-border p-4 cursor-text"
      >
        <div className="flex gap-4">
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
          <div className="flex-1">
            <div className="text-x-textSecondary">
              {placeholder}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-x-border p-4">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-4">
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

          <div className="flex-1 min-w-0">
            <textarea
              value={text}
              onChange={(e) => {
                const newText = e.target.value;
                const newCount = computeVisibleCharCount(newText);
                if (newCount.visibleCount <= 280 || newText.length <= text.length) {
                  setText(newText);
                }
              }}
              placeholder={placeholder}
              className="w-full resize-none bg-transparent text-xl text-x-text placeholder-x-textSecondary focus:outline-none min-h-[120px]"
              rows={6}
              disabled={loading}
              autoFocus
            />

            {error && (
              <div className="mt-3 rounded-md bg-red-500/10 p-2 text-sm text-red-500">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between mt-3">
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

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setExpanded(false);
                    setText("");
                    setError("");
                  }}
                  className="rounded-full border border-x-border px-4 py-2 font-bold text-x-text hover:bg-x-hover"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canPost}
                  className="rounded-full bg-primary px-6 py-2 font-bold text-white transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Posting..." : "Post"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

