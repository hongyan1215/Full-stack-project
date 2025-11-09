import { prisma } from "@db/src/index";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
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
      return new NextResponse("User not found", { status: 404 });
    }

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

    const postsCount = user._count.posts + user._count.reposts;

    return NextResponse.json({
      ...user,
      postsCount,
      followingCount: user._count.follows,
      followersCount: user._count.following,
      isFollowing,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

