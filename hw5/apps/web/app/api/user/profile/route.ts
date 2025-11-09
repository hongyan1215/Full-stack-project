import { prisma } from "@db/src/index";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  bio: z.string().max(160).optional(),
  image: z.string().url().optional(),
  bannerImage: z.string().url().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
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
      return new NextResponse("User not found", { status: 404 });
    }

    const postsCount = user._count.posts + user._count.reposts;

    return NextResponse.json({
      ...user,
      postsCount,
      followingCount: user._count.follows,
      followersCount: user._count.following,
      likesCount: user._count.likes,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(parsed.error.format(), { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        image: true,
        userId: true,
        bio: true,
        bannerImage: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating profile:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

