"use client";

import { PostComposer } from "@ui/index";
import { useRouter } from "next/navigation";

export default function ComposePage() {
  const router = useRouter();

  const handleSuccess = () => {
    // Redirect to home after successful post
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 border-b border-x-border bg-black/80 backdrop-blur-md">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold text-x-text">Compose</h1>
        </div>
      </div>
      <PostComposer onSuccess={handleSuccess} />
    </div>
  );
}


