"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Repeat2, Heart } from "lucide-react";
import { useRouter } from "next/navigation";

interface PostActionsProps {
  postId: string;
  replyCount?: number;
  repostCount: number;
  likeCount: number;
  isLiked?: boolean;
  isReposted?: boolean;
  onReply?: () => void;
  currentUserId?: string;
}

export function PostActions({
  postId,
  replyCount = 0,
  repostCount: initialRepostCount,
  likeCount: initialLikeCount,
  isLiked: initialIsLiked = false,
  isReposted: initialIsReposted = false,
  onReply,
  currentUserId,
}: PostActionsProps) {
  const router = useRouter();
  
  // Local state for optimistic updates
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isReposted, setIsReposted] = useState(initialIsReposted);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [repostCount, setRepostCount] = useState(initialRepostCount);
  
  // Sync with props when they change (e.g., from Pusher updates)
  useEffect(() => {
    setIsLiked(initialIsLiked);
  }, [initialIsLiked]);
  
  useEffect(() => {
    setIsReposted(initialIsReposted);
  }, [initialIsReposted]);
  
  useEffect(() => {
    setLikeCount(initialLikeCount);
  }, [initialLikeCount]);
  
  useEffect(() => {
    setRepostCount(initialRepostCount);
  }, [initialRepostCount]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId) {
      router.push("/api/auth/signin");
      return;
    }

    // Optimistic update
    const previousIsLiked = isLiked;
    const previousLikeCount = likeCount;
    setIsLiked(!isLiked);
    setLikeCount((prev) => (previousIsLiked ? prev - 1 : prev + 1));

    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });

      if (!res.ok) {
        // Revert optimistic update on error
        setIsLiked(previousIsLiked);
        setLikeCount(previousLikeCount);
        
        if (res.status === 401) {
          router.push("/api/auth/signin");
          return;
        }
        throw new Error("Failed to toggle like");
      }

      // Pusher will update the final state, but optimistic update provides immediate feedback
    } catch (error) {
      // Revert optimistic update on error
      setIsLiked(previousIsLiked);
      setLikeCount(previousLikeCount);
      console.error("Error toggling like:", error);
    }
  };

  const handleRepost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId) {
      router.push("/api/auth/signin");
      return;
    }

    // Optimistic update
    const previousIsReposted = isReposted;
    const previousRepostCount = repostCount;
    setIsReposted(!isReposted);
    setRepostCount((prev) => (previousIsReposted ? prev - 1 : prev + 1));

    try {
      if (previousIsReposted) {
        // Unrepost
        const res = await fetch(`/api/reposts/${postId}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          // Revert optimistic update on error
          setIsReposted(previousIsReposted);
          setRepostCount(previousRepostCount);
          
          if (res.status === 401) {
            router.push("/api/auth/signin");
            return;
          }
          throw new Error("Failed to unrepost");
        }
      } else {
        // Repost
        const res = await fetch("/api/reposts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId }),
        });

        if (!res.ok) {
          // Revert optimistic update on error
          setIsReposted(previousIsReposted);
          setRepostCount(previousRepostCount);
          
          if (res.status === 401) {
            router.push("/api/auth/signin");
            return;
          }
          throw new Error("Failed to repost");
        }
        
        const data = await res.json();
        // If already reposted, ensure state is correct
        if (data.status === "already_reposted") {
          // State is already correct from optimistic update, but ensure it's synced
          setIsReposted(true);
        }
      }

      // Pusher will update the final state, but optimistic update provides immediate feedback
    } catch (error) {
      // Revert optimistic update on error
      setIsReposted(previousIsReposted);
      setRepostCount(previousRepostCount);
      console.error("Error toggling repost:", error);
    }
  };

  const handleReply = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onReply) {
      onReply();
    } else {
      router.push(`/post/${postId}`);
    }
  };

  return (
    <div className="flex items-center justify-between mt-3 max-w-md">
      {/* Reply */}
      <button
        onClick={handleReply}
        className="flex items-center gap-2 text-x-textSecondary hover:text-primary transition-colors group"
      >
        <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors">
          <MessageCircle className="h-5 w-5" />
        </div>
        {replyCount > 0 && <span className="text-sm">{replyCount}</span>}
      </button>

      {/* Repost */}
      <button
        onClick={handleRepost}
        className={`flex items-center gap-2 transition-colors group ${
          isReposted
            ? "text-green-500"
            : "text-x-textSecondary hover:text-green-500"
        }`}
      >
        <div
          className={`p-2 rounded-full transition-colors ${
            isReposted
              ? "bg-green-500/10"
              : "group-hover:bg-green-500/10"
          }`}
        >
          <Repeat2 className="h-5 w-5" />
        </div>
        {repostCount > 0 && <span className="text-sm">{repostCount}</span>}
      </button>

      {/* Like */}
      <button
        onClick={handleLike}
        className={`flex items-center gap-2 transition-colors group ${
          isLiked
            ? "text-red-500"
            : "text-x-textSecondary hover:text-red-500"
        }`}
      >
        <div
          className={`p-2 rounded-full transition-colors ${
            isLiked
              ? "bg-red-500/10"
              : "group-hover:bg-red-500/10"
          }`}
        >
          <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
        </div>
        {likeCount > 0 && <span className="text-sm">{likeCount}</span>}
      </button>
    </div>
  );
}

