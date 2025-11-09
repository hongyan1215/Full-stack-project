"use client";

import { useState, useEffect } from "react";
import { InlinePostComposer } from "@ui/index";
import { RealTimePostCard } from "@/components/RealTimePostCard";
import { useRouter } from "next/navigation";

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

interface HomeClientProps {
  currentUserId?: string;
  userImage?: string | null;
  userUserId?: string | null;
}

export function HomeClient({
  currentUserId,
  userImage,
  userUserId,
}: HomeClientProps) {
  const [tab, setTab] = useState<"all" | "following">("all");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchPosts();
  }, [tab]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts?tab=${tab}`);
      if (!res.ok) throw new Error("Failed to fetch posts");
      const data = await res.json();
      setPosts(data);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostSuccess = () => {
    fetchPosts();
  };

  const handlePostClick = (postId: string) => {
    router.push(`/post/${postId}`);
  };

  return (
    <div className="min-h-screen">
      {/* Header with tabs */}
      <div className="sticky top-0 z-10 border-b border-x-border bg-black/80 backdrop-blur-md">
        <div className="flex">
          <button
            onClick={() => setTab("all")}
            className={`flex-1 px-4 py-3 text-center font-bold transition-colors relative ${
              tab === "all"
                ? "text-x-text"
                : "text-x-textSecondary hover:bg-x-hover"
            }`}
          >
            All
            {tab === "all" && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setTab("following")}
            className={`flex-1 px-4 py-3 text-center font-bold transition-colors relative ${
              tab === "following"
                ? "text-x-text"
                : "text-x-textSecondary hover:bg-x-hover"
            }`}
          >
            Following
            {tab === "following" && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
            )}
          </button>
        </div>
      </div>

      {/* Inline Post Composer */}
      {currentUserId && (
        <InlinePostComposer
          onSuccess={handlePostSuccess}
          userImage={userImage}
          currentUserId={currentUserId}
        />
      )}

      {/* Posts List */}
      <div className="divide-y divide-x-border">
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-x-textSecondary">Loading...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-x-textSecondary">
              {tab === "following"
                ? "No posts from people you follow yet."
                : "No posts yet. Be the first to post!"}
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <RealTimePostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              onClick={() => handlePostClick(post.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

