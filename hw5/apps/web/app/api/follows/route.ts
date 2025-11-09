import { prisma } from "@db/src/index";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { userId: targetUserId } = await req.json();

    if (!targetUserId) {
      return new NextResponse("User ID is required", { status: 400 });
    }

    // Find the user by userId (not id)
    const targetUser = await prisma.user.findUnique({
      where: { userId: targetUserId },
      select: { id: true },
    });

    if (!targetUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Check if trying to follow oneself
    if (targetUser.id === session.user.id) {
      return new NextResponse("Cannot follow yourself", { status: 400 });
    }

    // Check if already following
    const existingFollow = await prisma.follow.findFirst({
      where: {
        followerId: session.user.id,
        followingId: targetUser.id,
      },
    });

    if (existingFollow) {
      return new NextResponse("Already following this user", { status: 400 });
    }

    // Create follow relationship
    await prisma.follow.create({
      data: {
        followerId: session.user.id,
        followingId: targetUser.id,
      },
    });

    return NextResponse.json({ status: "followed" });
  } catch (error) {
    console.error("Error following user:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { userId: targetUserId } = await req.json();

    if (!targetUserId) {
      return new NextResponse("User ID is required", { status: 400 });
    }

    // Find the user by userId (not id)
    const targetUser = await prisma.user.findUnique({
      where: { userId: targetUserId },
      select: { id: true },
    });

    if (!targetUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Find and delete follow relationship
    const existingFollow = await prisma.follow.findFirst({
      where: {
        followerId: session.user.id,
        followingId: targetUser.id,
      },
    });

    if (!existingFollow) {
      return new NextResponse("Not following this user", { status: 400 });
    }

    await prisma.follow.delete({
      where: { id: existingFollow.id },
    });

    return NextResponse.json({ status: "unfollowed" });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

