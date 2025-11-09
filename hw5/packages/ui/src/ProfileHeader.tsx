"use client";

import { EditProfileModal } from "./EditProfileModal";
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

interface ProfileHeaderProps {
  user: UserProfile;
  onUpdate?: () => void;
  isOwnProfile?: boolean;
  currentUserId?: string;
  isFollowing?: boolean;
  onFollow?: () => void;
  isLoading?: boolean;
}

export function ProfileHeader({
  user,
  onUpdate,
  isOwnProfile = false,
  currentUserId,
  isFollowing = false,
  onFollow,
  isLoading = false,
}: ProfileHeaderProps) {
  const [editModalOpen, setEditModalOpen] = useState(false);

  return (
    <>
      <div className="relative">
        {/* Banner */}
        <div className="h-48 w-full bg-x-border">
          {user.bannerImage ? (
            <img
              src={user.bannerImage}
              alt="Banner"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-blue-500 to-purple-500" />
          )}
        </div>

        {/* Avatar */}
        <div className="absolute -bottom-16 left-4 flex items-end">
          <div className="relative">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || "User"}
                className="h-32 w-32 rounded-full border-4 border-black object-cover"
              />
            ) : (
              <div className="h-32 w-32 rounded-full border-4 border-black bg-x-border" />
            )}
          </div>
        </div>

        {/* Edit Profile or Follow Button */}
        <div className="absolute bottom-4 right-4">
          {isOwnProfile ? (
            <button
              onClick={() => setEditModalOpen(true)}
              className="rounded-full border border-x-border bg-black px-4 py-2 font-bold text-x-text hover:bg-x-hover"
            >
              Edit Profile
            </button>
          ) : (
            <button
              onClick={onFollow}
              disabled={isLoading || !currentUserId}
              className={`rounded-full border border-x-border px-4 py-2 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isFollowing
                  ? "bg-x-text text-black hover:bg-x-textSecondary"
                  : "bg-black text-x-text hover:bg-x-hover"
              }`}
            >
              {isLoading ? "Loading..." : isFollowing ? "Following" : "Follow"}
            </button>
          )}
        </div>
      </div>

      {/* User Info */}
      <div className="mt-20 px-4 pb-4">
        <div className="mb-3">
          <h1 className="text-2xl font-bold text-x-text">
            {user.name || "Anonymous"}
          </h1>
          {user.userId && (
            <p className="text-x-textSecondary">@{user.userId}</p>
          )}
        </div>

        {user.bio && (
          <p className="mb-3 whitespace-pre-wrap text-x-text">{user.bio}</p>
        )}

        <div className="flex gap-4 text-sm text-x-textSecondary">
          <span>
            <span className="font-bold text-x-text">{user.followingCount}</span>{" "}
            Following
          </span>
          <span>
            <span className="font-bold text-x-text">{user.followersCount}</span>{" "}
            Followers
          </span>
          <span>
            <span className="font-bold text-x-text">{user.postsCount}</span> Posts
          </span>
        </div>
      </div>

      {isOwnProfile && (
        <EditProfileModal
          user={user}
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onSuccess={() => {
            onUpdate?.();
            setEditModalOpen(false);
          }}
        />
      )}
    </>
  );
}

