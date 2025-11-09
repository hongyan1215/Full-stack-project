"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: { [key: string]: string } = {
    Configuration: "There is a problem with the server configuration.",
    AccessDenied: "You do not have permission to sign in.",
    Verification: "The verification token has expired or has already been used.",
    Default: "An error occurred during authentication.",
  };

  const errorMessage = error ? errorMessages[error] || errorMessages.Default : errorMessages.Default;

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="max-w-md rounded-lg border border-x-border bg-black p-8 text-center">
        <h1 className="mb-4 text-2xl font-bold text-red-500">Authentication Error</h1>
        <p className="mb-2 text-x-text">{errorMessage}</p>
        {error && (
          <p className="mb-6 text-sm text-x-textSecondary">Error code: {error}</p>
        )}
        <div className="space-y-4">
          <Link
            href="/api/auth/signin"
            className="block rounded-full bg-[#1D9BF0] px-6 py-3 font-bold text-white transition-colors hover:bg-[#1a8cd8]"
          >
            Try Again
          </Link>
          <p className="text-sm text-x-textSecondary">
            If this problem persists, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
}
