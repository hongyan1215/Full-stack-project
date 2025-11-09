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

  // Users can only see their own likes
  if (userId !== session.user.id) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const likes = await prisma.like.findMany({
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

    const posts = likes.map((like) => like.post);

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching user likes:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

