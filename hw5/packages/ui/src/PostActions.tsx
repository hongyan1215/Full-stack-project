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
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  // Sync states when props change (for real-time updates from Pusher)
  // Skip if we're currently updating to avoid conflicts
  useEffect(() => {
    if (!isUpdating) {
      setLiked(isLiked);
    }
  }, [isLiked, isUpdating]);

  useEffect(() => {
    if (!isUpdating) {
      setLikes(likeCount);
    }
  }, [likeCount, isUpdating]);

  useEffect(() => {
    if (!isUpdating) {
      setReposted(isReposted);
    }
  }, [isReposted, isUpdating]);

  useEffect(() => {
    if (!isUpdating) {
      setReposts(repostCount);
    }
  }, [repostCount, isUpdating]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId) {
      router.push("/api/auth/signin");
      return;
    }

    // Optimistic update
    const previousLiked = liked;
    const previousLikes = likes;

    setIsUpdating(true);
    setLiked(!liked);
    setLikes(liked ? Math.max(0, likes - 1) : likes + 1);

    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });

      if (!res.ok) {
        // Revert on error
        setLiked(previousLiked);
        setLikes(previousLikes);

        if (res.status === 401) {
          router.push("/api/auth/signin");
          return;
        }
        throw new Error("Failed to toggle like");
      }

      // Allow Pusher updates after a short delay
      setTimeout(() => setIsUpdating(false), 1000);
    } catch (error) {
      console.error("Error toggling like:", error);
      // Revert on error
      setLiked(previousLiked);
      setLikes(previousLikes);
      setIsUpdating(false);
    }
  };

  const handleRepost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId) {
      router.push("/api/auth/signin");
      return;
    }

    // Optimistic update
    const previousReposted = reposted;
    const previousReposts = reposts;

    setIsUpdating(true);
    setReposted(!reposted);
    setReposts(reposted ? Math.max(0, reposts - 1) : reposts + 1);

    try {
      if (previousReposted) {
        // Unrepost
        const res = await fetch(`/api/reposts/${postId}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          // Revert on error
          setReposted(previousReposted);
          setReposts(previousReposts);

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
          // Revert on error
          setReposted(previousReposted);
          setReposts(previousReposts);

          if (res.status === 401) {
            router.push("/api/auth/signin");
            return;
          }
          throw new Error("Failed to repost");
        }
      }

      // Allow Pusher updates after a short delay
      setTimeout(() => setIsUpdating(false), 1000);
    } catch (error) {
      console.error("Error toggling repost:", error);
      // Revert on error
      setReposted(previousReposted);
      setReposts(previousReposts);
      setIsUpdating(false);
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

