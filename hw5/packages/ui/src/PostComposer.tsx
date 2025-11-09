"use client";

import { useState } from "react";

interface PostComposerProps {
  onSuccess?: () => void;
  placeholder?: string;
  parentId?: string;
}

export function PostComposer({ onSuccess, placeholder = "What's happening?", parentId }: PostComposerProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const charCount = text.length;
  const maxChars = 280;
  const remaining = maxChars - charCount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || loading) return;

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
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-b border-x-border p-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="w-full resize-none bg-transparent text-xl text-x-text placeholder-x-textSecondary focus:outline-none"
        rows={3}
        disabled={loading}
        maxLength={maxChars}
      />

      {error && (
        <div className="mb-3 rounded-md bg-red-500/10 p-2 text-sm text-red-500">
          {error}
        </div>
      )}

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
            {remaining < 20 && remaining}
          </span>
        </div>

        <button
          type="submit"
          disabled={!text.trim() || loading || remaining < 0}
          className="rounded-full bg-primary px-6 py-2 font-bold text-white transition hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  );
}
