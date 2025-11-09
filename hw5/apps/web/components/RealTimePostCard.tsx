"use client";

import { useState, useEffect, useCallback } from "react";
import { PostCard } from "@ui/index";
import { usePostUpdates } from "@/lib/use-pusher";

interface Post {
  id: string;
  text: string;
  createdAt: Date | string;
  author: {
    id: string;
    name: string | null;
    userId: string | null;
    image: string | null;
  };
  isRepost?: boolean;
  isLiked?: boolean;
  isReposted?: boolean;
  replyCount?: number;
  _count?: {
    likes: number;
    reposts: number;
  };
}

interface RealTimePostCardProps {
  post: Post;
  currentUserId?: string;
  onReply?: () => void;
  onClick?: () => void;
}

export function RealTimePostCard({
  post: initialPost,
  currentUserId,
  onReply,
  onClick,
}: RealTimePostCardProps) {
  const [post, setPost] = useState(initialPost);

  // Update post when initialPost changes
  useEffect(() => {
    setPost(initialPost);
  }, [initialPost]);

  // Handle like updates
  const handleLikeAdded = useCallback(
    (data: { postId: string; likeCount: number; userId: string }) => {
      if (data.postId === post.id) {
        // Update like count from Pusher event (real-time update)
        // This will sync with PostActions component through prop updates
        setPost((prev) => ({
          ...prev,
          _count: {
            ...prev._count,
            likes: data.likeCount,
          } as { likes: number; reposts: number },
        }));
      }
    },
    [post.id]
  );

  const handleLikeRemoved = useCallback(
    (data: { postId: string; likeCount: number; userId: string }) => {
      if (data.postId === post.id) {
        // Update like count from Pusher event (real-time update)
        setPost((prev) => ({
          ...prev,
          _count: {
            ...prev._count,
            likes: data.likeCount,
          } as { likes: number; reposts: number },
        }));
      }
    },
    [post.id]
  );

  // Handle comment added event (for reply count updates)
  const handleCommentAdded = useCallback(
    (data: { postId: string; parentId: string | null; comment: Post; replyCount: number }) => {
      if (data.postId === post.id) {
        // Update reply count on the post
        setPost((prev) => ({
          ...prev,
          replyCount: data.replyCount,
        }));
      }
    },
    [post.id]
  );

  // Subscribe to Pusher events
  usePostUpdates(
    post.id,
    {
      onLikeAdded: handleLikeAdded,
      onLikeRemoved: handleLikeRemoved,
      onCommentAdded: handleCommentAdded,
    },
    true
  );

  return (
    <PostCard
      post={post}
      currentUserId={currentUserId}
      onReply={onReply}
      onClick={onClick}
    />
  );
}

