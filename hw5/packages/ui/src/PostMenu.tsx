"use client";

import { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface PostMenuProps {
  postId: string;
  authorId: string;
  currentUserId?: string;
  isRepost?: boolean;
  onDelete?: () => void;
}

export function PostMenu({
  postId,
  authorId,
  currentUserId,
  isRepost = false,
  onDelete,
}: PostMenuProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Only show menu if user is the author and it's not a repost
  if (!currentUserId || authorId !== currentUserId || isRepost) {
    return null;
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete post");
      }

      if (onDelete) {
        onDelete();
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="rounded-full p-2 hover:bg-x-hover text-x-textSecondary transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[180px] rounded-lg bg-black border border-x-border p-1 shadow-lg z-50"
          align="end"
        >
          <DropdownMenu.Item
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            disabled={loading}
            className="flex items-center gap-3 px-4 py-2 rounded-md text-red-500 hover:bg-red-500/10 cursor-pointer outline-none disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

