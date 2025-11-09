"use client";

import { ProfileHeader, ProfileTabs } from "@ui/index";
import { useRouter } from "next/navigation";

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
  _count?: {
    likes: number;
    reposts: number;
  };
}

interface ProfileClientProps {
  user: UserProfile;
  posts: Post[];
  likes: Post[];
}

export function ProfileClient({ user, posts, likes }: ProfileClientProps) {
  const router = useRouter();

  const handleUpdate = () => {
    router.refresh();
  };

  return (
    <>
      <ProfileHeader
        user={user}
        onUpdate={handleUpdate}
        isOwnProfile={true}
        currentUserId={user.id}
      />
      <ProfileTabs posts={posts} likes={likes} currentUserId={user.id} showLikesTab={true} />
    </>
  );
}

