"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const [userId, setUserId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/user/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      // Success - redirect to home
      router.push("/");
      router.refresh();
    } catch (err) {
      setError("Failed to set username");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-x-text">Welcome!</h1>
          <p className="mt-2 text-x-textSecondary">Choose your username</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-x-text">
              Username
            </label>
            <div className="relative mt-1">
              <span className="absolute inset-y-0 left-3 flex items-center text-x-textSecondary">
                @
              </span>
              <input
                type="text"
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full rounded-md border border-x-border bg-black px-3 py-2 pl-7 text-x-text placeholder-x-textSecondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="username"
                required
                minLength={3}
                maxLength={15}
                pattern="[a-zA-Z0-9_]+"
                disabled={loading}
              />
            </div>
            <p className="mt-1 text-xs text-x-textSecondary">
              3-15 characters, letters, numbers, and underscores only
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-500">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !userId}
            className="w-full rounded-full bg-primary px-4 py-3 font-bold text-white transition hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Setting up..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
