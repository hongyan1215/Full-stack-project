import { prisma } from "@db/src/index";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { postInputSchema } from "@/lib/validation";
import { NextResponse } from "next/server";
import { computeVisibleCharCount } from "@utils/shared";
import { pusherServer, PostChannel } from "@/lib/pusher-server";
import { createNotification } from "@/lib/notifications";

export async function GET(req: Request) {
  const session = await auth();
  const { searchParams } = new URL(req.url);
  const tab = searchParams.get("tab") || "all";

  try {
    let posts: any[] = [];
    let reposts: any[] = [];

    if (tab === "following" && session?.user?.id) {
      // Get list of users that current user is following
      const follows = await prisma.follow.findMany({
        where: { followerId: session.user.id },
        select: { followingId: true },
      });

      const followingIds = follows.map((f) => f.followingId);

      if (followingIds.length > 0) {
        // Get posts from followed users
        posts = await prisma.post.findMany({
          where: {
            authorId: { in: followingIds },
            parentId: null, // Only top-level posts, not replies
          },
          orderBy: { createdAt: "desc" },
          take: 50,
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

        // Get reposts from followed users
        const userReposts = await prisma.repost.findMany({
          where: {
            userId: { in: followingIds },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
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

        reposts = userReposts
          .filter((r) => r.post !== null && r.post.parentId === null)
          .map((r) => ({
            ...r.post,
            isRepost: true,
            repostedAt: r.createdAt,
            repostedBy: r.userId,
          }));
      }
    } else {
      // Get all posts
      posts = await prisma.post.findMany({
        where: {
          parentId: null, // Only top-level posts, not replies
        },
        orderBy: { createdAt: "desc" },
        take: 50,
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

      // Get all reposts
      const userReposts = await prisma.repost.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
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

      reposts = userReposts
        .filter((r) => r.post !== null && r.post.parentId === null)
        .map((r) => ({
          ...r.post,
          isRepost: true,
          repostedAt: r.createdAt,
          repostedBy: r.userId,
        }));
    }

    // Mark posts as not reposts
    const markedPosts = posts.map((p) => ({
      ...p,
      isRepost: false,
    }));

    // Combine and sort by date
    const allPosts = [...markedPosts, ...reposts].sort((a, b) => {
      const dateA = a.isRepost ? new Date(a.repostedAt) : a.createdAt;
      const dateB = b.isRepost ? new Date(b.repostedAt) : b.createdAt;
      return dateB.getTime() - dateA.getTime();
    });

    // Check user likes and reposts if logged in
    if (session?.user?.id) {
      const postIds = allPosts.map((p) => p.id);
      const userLikes = await prisma.like.findMany({
        where: {
          postId: { in: postIds },
          userId: session.user.id,
        },
      });

      const userReposts = await prisma.repost.findMany({
        where: {
          postId: { in: postIds },
          userId: session.user.id,
        },
      });

      const likedPostIds = new Set(userLikes.map((l) => l.postId));
      const repostedPostIds = new Set(userReposts.map((r) => r.postId));

      const postsWithUserState = allPosts.map((post) => ({
        ...post,
        isLiked: likedPostIds.has(post.id),
        isReposted: repostedPostIds.has(post.id),
      }));

      // Get reply counts
      const postsWithReplyCounts = await Promise.all(
        postsWithUserState.map(async (post) => {
          const replyCount = await prisma.post.count({
            where: { parentId: post.id },
          });
          return {
            ...post,
            replyCount,
          };
        })
      );

      return NextResponse.json(postsWithReplyCounts);
    }

    // Get reply counts for non-logged-in users
    const postsWithReplyCounts = await Promise.all(
      allPosts.map(async (post) => {
        const replyCount = await prisma.post.count({
          where: { parentId: post.id },
        });
        return {
          ...post,
          replyCount,
          isLiked: false,
          isReposted: false,
        };
      })
    );

    return NextResponse.json(postsWithReplyCounts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
  const ip = (req.headers.get("x-forwarded-for") ?? "") + session.user.id;
  if (!rateLimit(`post:${ip}`).ok) return new NextResponse("Rate limited", { status: 429 });

  const json = await req.json();
  const parsed = postInputSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json(parsed.error.format(), { status: 400 });

  const { text, parentId } = parsed.data;
  const c = computeVisibleCharCount(text);
  if (c.visibleCount > 280) return new NextResponse("Too long", { status: 400 });

  const post = await prisma.post.create({
    data: {
      authorId: session.user.id,
      text,
      linkCharCount: 23 * c.urlCount,
      charCount: c.visibleCount,
      parentId: parentId ?? null,
    },
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

  // If this is a comment (has parentId), trigger comment-added event and create notification
  if (parentId) {
    // Get parent post to find author
    const parentPost = await prisma.post.findUnique({
      where: { id: parentId },
      select: { authorId: true },
    });

    if (parentPost) {
      // Get reply count for parent post
      const replyCount = await prisma.post.count({ where: { parentId } });
      
      // Trigger event on parent post channel
      await pusherServer.trigger(PostChannel(parentId), "comment-added", {
        postId: parentId,
        parentId: parentId,
        comment: {
          ...post,
          replyCount: 0,
          isLiked: false,
          isReposted: false,
        },
        replyCount,
      });

      // Create notification for parent post author (if not commenting on own post)
      await createNotification({
        userId: parentPost.authorId,
        actorId: session.user.id,
        type: "comment",
        postId: parentId,
      });
    }
  }

  return NextResponse.json(post, { status: 201 });
}


