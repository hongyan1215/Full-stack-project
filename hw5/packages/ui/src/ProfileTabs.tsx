"use client";

import { useState } from "react";
import { PostCard } from "./PostCard";

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
  _count?: {
    likes: number;
    reposts: number;
  };
  isRepost?: boolean;
  repostId?: string; // Unique ID for repost record
}

interface ProfileTabsProps {
  posts: Post[];
  likes?: Post[];
  currentUserId?: string;
  showLikesTab?: boolean;
}

export function ProfileTabs({ posts, likes = [], currentUserId, showLikesTab = true }: ProfileTabsProps) {
  // When showLikesTab is false, always show posts tab
  const [activeTab, setActiveTab] = useState<"posts" | "likes">("posts");
  
  // Ensure activeTab is always "posts" when showLikesTab is false
  const effectiveTab = showLikesTab ? activeTab : "posts";

  return (
    <div>
      {/* Tabs */}
      <div className="flex border-b border-x-border">
        <button
          onClick={() => setActiveTab("posts")}
          className={`flex-1 px-4 py-3 text-center font-bold transition-colors ${
            effectiveTab === "posts"
              ? "border-b-2 border-primary text-x-text"
              : "text-x-textSecondary hover:bg-x-hover"
          }`}
        >
          Posts
        </button>
        {showLikesTab && (
          <button
            onClick={() => setActiveTab("likes")}
            className={`flex-1 px-4 py-3 text-center font-bold transition-colors ${
              effectiveTab === "likes"
                ? "border-b-2 border-primary text-x-text"
                : "text-x-textSecondary hover:bg-x-hover"
            }`}
          >
            Likes
          </button>
        )}
      </div>

      {/* Content */}
      <div className="divide-y divide-x-border">
        {effectiveTab === "posts" ? (
          posts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-x-textSecondary">No posts yet</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard 
                key={post.isRepost && post.repostId ? `repost-${post.repostId}` : `post-${post.id}`}
                post={post} 
                currentUserId={currentUserId}
              />
            ))
          )
        ) : showLikesTab ? (
          likes.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-x-textSecondary">No likes yet</p>
            </div>
          ) : (
            likes.map((post, index) => (
              <PostCard 
                key={`like-${post.id}-${index}`}
                post={post} 
                currentUserId={currentUserId}
              />
            ))
          )
        ) : null}
      </div>
    </div>
  );
}

