import { prisma } from "@db/src/index";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || session.user.id;

  try {
    // Get user's own posts
    const posts = await prisma.post.findMany({
      where: {
        authorId: userId,
      },
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
      where: {
        userId: userId,
      },
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

    // Combine posts and reposts, mark reposts
    const allPosts = [
      ...posts.map((post) => ({ ...post, isRepost: false as const, repostedAt: undefined })),
      ...reposts.map((repost) => ({
        ...repost.post,
        isRepost: true as const,
        repostedAt: repost.createdAt,
      })),
    ].sort((a, b) => {
      const dateA = a.isRepost && a.repostedAt ? a.repostedAt : a.createdAt;
      const dateB = b.isRepost && b.repostedAt ? b.repostedAt : b.createdAt;
      return dateB.getTime() - dateA.getTime();
    });

    return NextResponse.json(allPosts);
  } catch (error) {
    console.error("Error fetching user posts:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

