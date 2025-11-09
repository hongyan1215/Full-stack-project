"use client";

import { ProfileHeader, ProfileTabs } from "@ui/index";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface UserProfile {
  id: string;
  name: string | null;
  image: string | null;
  userId: string | null;
  bio: string | null;
  bannerImage: string | null;
  postsCount: number;
  followingCount: number;
  followersCount: number;
}

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
  repostId?: string;
  isLiked?: boolean;
  isReposted?: boolean;
  replyCount?: number;
  _count?: {
    likes: number;
    reposts: number;
  };
}

interface PublicProfileClientProps {
  user: UserProfile;
  posts: Post[];
  currentUserId?: string;
  isFollowing: boolean;
}

export function PublicProfileClient({
  user,
  posts,
  currentUserId,
  isFollowing: initialIsFollowing,
}: PublicProfileClientProps) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async () => {
    if (!currentUserId || !user.userId) {
      // Redirect to sign in if not logged in
      router.push("/api/auth/signin");
      return;
    }

    setIsLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        const res = await fetch("/api/follows", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.userId }),
        });

        if (res.ok) {
          setIsFollowing(false);
          // Refresh to update follower count
          router.refresh();
        } else {
          console.error("Failed to unfollow user");
        }
      } else {
        // Follow
        const res = await fetch("/api/follows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.userId }),
        });

        if (res.ok) {
          setIsFollowing(true);
          // Refresh to update follower count
          router.refresh();
        } else {
          console.error("Failed to follow user");
        }
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ProfileHeader
        user={user}
        isOwnProfile={false}
        currentUserId={currentUserId}
        isFollowing={isFollowing}
        onFollow={handleFollow}
        isLoading={isLoading}
      />
      <ProfileTabs 
        posts={posts} 
        currentUserId={currentUserId} 
        showLikesTab={false} 
      />
    </>
  );
}

