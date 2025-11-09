import { prisma } from "@db/src/index";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createNotification } from "@/lib/notifications";

const repostSchema = z.object({
  postId: z.string(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = repostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(parsed.error.format(), { status: 400 });
    }

    const { postId } = parsed.data;

    // Check if post exists and get author
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) {
      return new NextResponse("Post not found", { status: 404 });
    }

    // Check if repost already exists
    const existingRepost = await prisma.repost.findFirst({
      where: {
        postId,
        userId: session.user.id,
      },
    });

    if (existingRepost) {
      // Already reposted, return success (idempotent)
      return NextResponse.json({ status: "already_reposted", repost: existingRepost });
    }

    // Create repost
    const repost = await prisma.repost.create({
      data: {
        postId,
        userId: session.user.id,
      },
    });

    // Create notification for post author (if not reposting own post)
    await createNotification({
      userId: post.authorId,
      actorId: session.user.id,
      type: "repost",
      postId,
    });

    return NextResponse.json({ status: "reposted", repost }, { status: 201 });
  } catch (error) {
    console.error("Error creating repost:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

