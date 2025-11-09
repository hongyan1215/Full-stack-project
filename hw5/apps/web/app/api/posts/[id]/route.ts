import { prisma } from "@db/src/index";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    // Get the post
    const post = await prisma.post.findUnique({
      where: { id },
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

    if (!post) {
      return new NextResponse("Post not found", { status: 404 });
    }

    // Get all replies (comments) for this post
    const replies = await prisma.post.findMany({
      where: { parentId: id },
      orderBy: { createdAt: "asc" },
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

    // Check if user has liked/reposted replies
    let userLikes: Set<string> = new Set();
    let userReposts: Set<string> = new Set();
    if (session?.user?.id && replies.length > 0) {
      const replyIds = replies.map((r) => r.id);
      const likes = await prisma.like.findMany({
        where: {
          postId: { in: replyIds },
          userId: session.user.id,
        },
      });
      const reposts = await prisma.repost.findMany({
        where: {
          postId: { in: replyIds },
          userId: session.user.id,
        },
      });
      userLikes = new Set(likes.map((l) => l.postId));
      userReposts = new Set(reposts.map((r) => r.postId));
    }

    // Check if user has liked/reposted this post
    let userLike = null;
    let userRepost = null;
    if (session?.user?.id) {
      userLike = await prisma.like.findFirst({
        where: {
          postId: id,
          userId: session.user.id,
        },
      });

      userRepost = await prisma.repost.findFirst({
        where: {
          postId: id,
          userId: session.user.id,
        },
      });
    }

    // Get reply counts for each reply and add user state
    const repliesWithCounts = await Promise.all(
      replies.map(async (reply) => {
        const replyCount = await prisma.post.count({
          where: { parentId: reply.id },
        });
        return {
          ...reply,
          replyCount,
          isLiked: userLikes.has(reply.id),
          isReposted: userReposts.has(reply.id),
        };
      })
    );

    return NextResponse.json({
      post: {
        ...post,
        isLiked: !!userLike,
        isReposted: !!userRepost,
        replyCount: replies.length,
      },
      replies: repliesWithCounts,
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { id } = await params;

    // Get the post
    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      return new NextResponse("Post not found", { status: 404 });
    }

    // Check if user is the author
    if (post.authorId !== session.user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Delete all associated data (likes, reposts, mentions, hashtags, replies)
    await prisma.like.deleteMany({
      where: { postId: id },
    });

    await prisma.repost.deleteMany({
      where: { postId: id },
    });

    await prisma.mention.deleteMany({
      where: { postId: id },
    });

    await prisma.postHashtag.deleteMany({
      where: { postId: id },
    });

    // Delete all replies (recursive)
    const deleteReplies = async (postId: string) => {
      const replies = await prisma.post.findMany({
        where: { parentId: postId },
      });

      for (const reply of replies) {
        await deleteReplies(reply.id);
        await prisma.like.deleteMany({ where: { postId: reply.id } });
        await prisma.repost.deleteMany({ where: { postId: reply.id } });
        await prisma.mention.deleteMany({ where: { postId: reply.id } });
        await prisma.postHashtag.deleteMany({ where: { postId: reply.id } });
        await prisma.post.delete({ where: { id: reply.id } });
      }
    };

    await deleteReplies(id);

    // Delete the post
    await prisma.post.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting post:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

