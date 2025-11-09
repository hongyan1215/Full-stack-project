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
  repostCount,
  likeCount,
  isLiked = false,
  isReposted = false,
  onReply,
  currentUserId,
}: PostActionsProps) {
  const [liked, setLiked] = useState(isLiked);
  const [likes, setLikes] = useState(likeCount);
  const [reposted, setReposted] = useState(isReposted);
  const [reposts, setReposts] = useState(repostCount);
  const router = useRouter();

  // Sync states when props change (for real-time updates from Pusher)
  // But keep the optimistic update logic in the handlers
  useEffect(() => {
    setLiked(isLiked);
  }, [isLiked]);

  useEffect(() => {
    setReposted(isReposted);
  }, [isReposted]);

  useEffect(() => {
    setReposts(repostCount);
  }, [repostCount]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId) {
      router.push("/api/auth/signin");
      return;
    }

    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          // Session expired, redirect to sign in
          router.push("/api/auth/signin");
          return;
        }
        throw new Error("Failed to toggle like");
      }

      // Don't update local state here - let Pusher handle it
      // This prevents double counting when Pusher broadcasts the update
    } catch (error) {
      console.error("Error toggling like:", error);
      // Don't redirect on network errors, just log them
    }
  };

  const handleRepost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId) {
      router.push("/api/auth/signin");
      return;
    }

    try {
      if (reposted) {
        // Unrepost
        const res = await fetch(`/api/reposts/${postId}`, {
          method: "DELETE",
        });

        if (!res.ok) {
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
          if (res.status === 401) {
            router.push("/api/auth/signin");
            return;
          }
          throw new Error("Failed to repost");
        }
      }

      // Don't update local state here - let Pusher handle it
      // This prevents double counting when Pusher broadcasts the update
    } catch (error) {
      console.error("Error toggling repost:", error);
      // Don't redirect on network errors, just log them
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
          reposted
            ? "text-green-500"
            : "text-x-textSecondary hover:text-green-500"
        }`}
      >
        <div
          className={`p-2 rounded-full transition-colors ${
            reposted
              ? "bg-green-500/10"
              : "group-hover:bg-green-500/10"
          }`}
        >
          <Repeat2 className="h-5 w-5" />
        </div>
        {reposts > 0 && <span className="text-sm">{reposts}</span>}
      </button>

      {/* Like */}
      <button
        onClick={handleLike}
        className={`flex items-center gap-2 transition-colors group ${
          liked
            ? "text-red-500"
            : "text-x-textSecondary hover:text-red-500"
        }`}
      >
        <div
          className={`p-2 rounded-full transition-colors ${
            liked
              ? "bg-red-500/10"
              : "group-hover:bg-red-500/10"
          }`}
        >
          <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
        </div>
        {likes > 0 && <span className="text-sm">{likes}</span>}
      </button>
    </div>
  );
}

