"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { InlinePostComposer } from "@ui/index";
import { RealTimePostCard } from "@/components/RealTimePostCard";
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
  parentId?: string | null;
}

interface PostThreadProps {
  postId: string;
  currentUserId?: string;
  userImage?: string | null;
}

export function PostThread({
  postId,
  currentUserId,
  userImage,
}: PostThreadProps) {
  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [replying, setReplying] = useState(false);
  const router = useRouter();

  // Handle comment added event
  const handleCommentAdded = useCallback(
    (data: { postId: string; parentId: string | null; comment: Post; replyCount: number }) => {
      if (data.postId === postId) {
        // Add new comment to replies
        setReplies((prev) => {
          // Check if comment already exists to avoid duplicates
          if (prev.some((r) => r.id === data.comment.id)) {
            return prev;
          }
          // Add the comment (duplicate check above handles the case where it was already added via API)
          return [...prev, data.comment].sort((a, b) => {
            const dateA = typeof a.createdAt === "string" ? new Date(a.createdAt) : a.createdAt;
            const dateB = typeof b.createdAt === "string" ? new Date(b.createdAt) : b.createdAt;
            return dateA.getTime() - dateB.getTime();
          });
        });

        // Update reply count on main post
        setPost((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            replyCount: data.replyCount,
          };
        });
      }
    },
    [postId]
  );

  // Subscribe to Pusher events for comment updates
  usePostUpdates(
    postId,
    {
      onCommentAdded: handleCommentAdded,
    },
    !!postId
  );

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}`);
      if (!res.ok) {
        if (res.status === 404) {
          router.push("/");
          return;
        }
        throw new Error("Failed to fetch post");
      }
      const data = await res.json();
      setPost(data.post);
      setReplies(data.replies || []);
    } catch (error) {
      console.error("Error fetching post:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReplySuccess = () => {
    setReplying(false);
    // Refresh post data to get the new comment
    // Pusher event will also trigger, but we check for duplicates
    fetchPost();
  };

  const handleReplyClick = () => {
    setReplying(true);
  };

  const handlePostClick = (replyId: string) => {
    router.push(`/post/${replyId}`);
  };

  const handleBack = () => {
    if (post?.parentId) {
      router.push(`/post/${post.parentId}`);
    } else {
      router.push("/");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="sticky top-0 z-10 border-b border-x-border bg-black/80 backdrop-blur-md">
          <div className="flex items-center gap-4 px-4 py-3">
            <Link
              href="/"
              className="rounded-full p-2 hover:bg-x-hover transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-x-text" />
            </Link>
            <h1 className="text-xl font-bold text-x-text">Post</h1>
          </div>
        </div>
        <div className="p-8 text-center">
          <p className="text-x-textSecondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Header with back button */}
      <div className="sticky top-0 z-10 border-b border-x-border bg-black/80 backdrop-blur-md">
        <div className="flex items-center gap-4 px-4 py-3">
          <button
            onClick={handleBack}
            className="rounded-full p-2 hover:bg-x-hover transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-x-text" />
          </button>
          <h1 className="text-xl font-bold text-x-text">Post</h1>
        </div>
      </div>

      {/* Main post */}
      <RealTimePostCard
        post={post}
        currentUserId={currentUserId}
        onReply={handleReplyClick}
      />

      {/* Reply composer */}
      {replying && currentUserId && (
        <div className="border-b border-x-border">
          <InlinePostComposer
            onSuccess={handleReplySuccess}
            placeholder="Post your reply"
            parentId={postId}
            userImage={userImage}
            currentUserId={currentUserId}
          />
          <div className="px-4 pb-4">
            <button
              onClick={() => setReplying(false)}
              className="text-sm text-x-textSecondary hover:text-x-text"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Replies */}
      <div className="divide-y divide-x-border">
        {replies.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-x-textSecondary">No replies yet.</p>
          </div>
        ) : (
          replies.map((reply) => (
            <div key={reply.id} className="pl-4 border-l-2 border-x-border ml-4">
              <RealTimePostCard
                post={reply}
                currentUserId={currentUserId}
                onReply={() => {
                  setReplying(true);
                }}
                onClick={() => handlePostClick(reply.id)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

