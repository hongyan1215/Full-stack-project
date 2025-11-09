import { auth } from "@/lib/auth";
import { prisma } from "@db/src/index";
import { notFound, redirect } from "next/navigation";
import { PublicProfileClient } from "./PublicProfileClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Props = { params: Promise<{ userId: string }> };

export default async function PublicProfilePage({ params }: Props) {
  const { userId } = await params;
  const session = await auth();

  // Find user by userId (not id)
  const user = await prisma.user.findUnique({
    where: { userId },
    select: {
      id: true,
      name: true,
      image: true,
      userId: true,
      bio: true,
      bannerImage: true,
      createdAt: true,
      _count: {
        select: {
          posts: true,
          reposts: true,
          follows: true,
          following: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  // Check if current user needs to set up userId
  if (session?.user?.id) {
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { userId: true },
    });

    if (!currentUser?.userId) {
      redirect("/setup");
    }
  }

  const postsCount = user._count.posts + user._count.reposts;

  const profileData = {
    ...user,
    postsCount,
    followingCount: user._count.follows,
    followersCount: user._count.following,
  };

  // Get user's posts
  const userPosts = await prisma.post.findMany({
    where: { authorId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          userId: true,
          image: true,
        },
      },
      _count: {
        select: {
          likes: true,
          reposts: true,
        },
      },
    },
  });

  // Get user's reposts
  const reposts = await prisma.repost.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      post: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              userId: true,
              image: true,
            },
          },
          _count: {
            select: {
              likes: true,
              reposts: true,
            },
          },
        },
      },
    },
  });

  // Get user's likes and reposts for posts (if current user is logged in)
  const userPostIds = userPosts.map((p) => p.id);
  const repostedPostIds = reposts.map((r) => r.post.id);
  const allPostIds = [...new Set([...userPostIds, ...repostedPostIds])];

  let likedPostIds = new Set<string>();
  let repostedPostIdsSet = new Set<string>();

  if (session?.user?.id) {
    const userLikesForPosts = await prisma.like.findMany({
      where: {
        postId: { in: allPostIds },
        userId: session.user.id,
      },
    });

    const userRepostsForPosts = await prisma.repost.findMany({
      where: {
        postId: { in: allPostIds },
        userId: session.user.id,
      },
    });

    likedPostIds = new Set(userLikesForPosts.map((l) => l.postId));
    repostedPostIdsSet = new Set(userRepostsForPosts.map((r) => r.postId));
  }

  // Create a map to track which posts are already included as original posts
  const originalPostIds = new Set(userPostIds);

  // Process reposts: only include reposts of posts that are NOT in userPosts
  // This prevents duplicate posts when user reposts their own post
  const repostsToInclude = reposts.filter((repost) => !originalPostIds.has(repost.post.id));

  // Combine posts and reposts with user state, ensuring no duplicates
  const posts = [
    ...userPosts.map((post) => ({
      ...post,
      isRepost: false as const,
      repostId: undefined,
      repostedAt: undefined,
      isLiked: likedPostIds.has(post.id),
      isReposted: repostedPostIdsSet.has(post.id),
    })),
    ...repostsToInclude.map((repost) => ({
      ...repost.post,
      isRepost: true as const,
      repostId: repost.id,
      repostedAt: repost.createdAt,
      isLiked: likedPostIds.has(repost.post.id),
      isReposted: repostedPostIdsSet.has(repost.post.id),
    })),
  ].sort((a, b) => {
    const dateA = a.isRepost && a.repostedAt ? a.repostedAt : a.createdAt;
    const dateB = b.isRepost && b.repostedAt ? b.repostedAt : b.createdAt;
    return dateB.getTime() - dateA.getTime();
  });

  // Get reply counts for posts
  const postsWithReplyCounts = await Promise.all(
    posts.map(async (post) => {
      const replyCount = await prisma.post.count({
        where: { parentId: post.id },
      });
      return {
        ...post,
        replyCount,
      };
    })
  );

  // Check if current user is following this user
  let isFollowing = false;
  if (session?.user?.id) {
    const follow = await prisma.follow.findFirst({
      where: {
        followerId: session.user.id,
        followingId: user.id,
      },
    });
    isFollowing = !!follow;
  }

  return (
    <div className="min-h-screen">
      {/* Header with back button */}
      <div className="sticky top-0 z-10 border-b border-x-border bg-black/80 backdrop-blur-md">
        <div className="flex items-center gap-4 px-4 py-3">
          <Link
            href="/"
            className="rounded-full p-2 hover:bg-x-hover transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-x-text" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-x-text">
              {user.name || "Profile"}
            </h1>
            <p className="text-sm text-x-textSecondary">
              {postsCount} {postsCount === 1 ? "Post" : "Posts"}
            </p>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <PublicProfileClient
        user={profileData}
        posts={postsWithReplyCounts}
        currentUserId={session?.user?.id}
        isFollowing={isFollowing}
      />
    </div>
  );
}
