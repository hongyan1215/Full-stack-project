import { auth } from "@/lib/auth";
import { prisma } from "@db/src/index";
import { redirect } from "next/navigation";
import { ProfileClient } from "./ProfileClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function MePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  // Get user profile
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
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
          likes: true,
          reposts: true,
          follows: true,
          following: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/api/auth/signin");
  }

  if (!user.userId) {
    redirect("/setup");
  }

  const postsCount = user._count.posts + user._count.reposts;

  const profileData = {
    ...user,
    postsCount,
    followingCount: user._count.follows,
    followersCount: user._count.following,
    likesCount: user._count.likes,
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

  // Get user's likes and reposts for posts
  const userPostIds = userPosts.map((p) => p.id);
  const repostedPostIds = reposts.map((r) => r.post.id);
  const allPostIds = [...new Set([...userPostIds, ...repostedPostIds])];
  
  const userLikesForPosts = await prisma.like.findMany({
    where: {
      postId: { in: allPostIds },
      userId: user.id,
    },
  });
  
  const userRepostsForPosts = await prisma.repost.findMany({
    where: {
      postId: { in: allPostIds },
      userId: user.id,
    },
  });
  
  const likedPostIds = new Set(userLikesForPosts.map((l) => l.postId));
  const repostedPostIdsSet = new Set(userRepostsForPosts.map((r) => r.postId));

  // Create a map to track which posts are already included as original posts
  const originalPostIds = new Set(userPostIds);
  
  // Process reposts: only include reposts of posts that are NOT in userPosts
  // This prevents duplicate posts when user reposts their own post
  const repostsToInclude = reposts.filter((repost) => !originalPostIds.has(repost.post.id));

  // Combine posts and reposts with user state, ensuring no duplicates
  const posts = [
    ...userPosts.map((post) => ({ 
      ...post, 
      isRepost: false,
      repostId: undefined, // Original post, no repost ID
      isLiked: likedPostIds.has(post.id),
      isReposted: repostedPostIdsSet.has(post.id),
    })),
    ...repostsToInclude.map((repost) => ({
      ...repost.post,
      isRepost: true,
      repostId: repost.id, // Include repost ID for unique key
      repostedAt: repost.createdAt,
      isLiked: likedPostIds.has(repost.post.id),
      isReposted: repostedPostIdsSet.has(repost.post.id),
    })),
  ].sort((a, b) => {
    const dateA = a.isRepost ? (a.repostedAt as Date) : a.createdAt;
    const dateB = b.isRepost ? (b.repostedAt as Date) : b.createdAt;
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

  // Get user's likes (posts that user has liked)
  const userLikes = await prisma.like.findMany({
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

  // Get reply counts and user state for liked posts
  const likes = await Promise.all(
    userLikes.map(async (like) => {
      const replyCount = await prisma.post.count({
        where: { parentId: like.post.id },
      });
      
      // Check if user has reposted this liked post
      const userRepost = await prisma.repost.findFirst({
        where: {
          postId: like.post.id,
          userId: user.id,
        },
      });
      
      return {
        ...like.post,
        isLiked: true, // User has liked this post
        isReposted: !!userRepost,
        replyCount,
      };
    })
  );

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
      <ProfileClient user={profileData} posts={postsWithReplyCounts} likes={likes} />
    </div>
  );
}
