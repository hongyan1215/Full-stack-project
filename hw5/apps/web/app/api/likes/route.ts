import { prisma } from "@db/src/index";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { pusherServer, PostChannel } from "@/lib/pusher-server";
import { createNotification } from "@/lib/notifications";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
  const { postId } = await req.json();
  
  const existing = await prisma.like.findFirst({ where: { postId, userId: session.user.id } });
  
  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    
    // Get updated like count
    const likeCount = await prisma.like.count({ where: { postId } });
    
    // Trigger Pusher event
    await pusherServer.trigger(PostChannel(postId), "like-removed", {
      postId,
      likeCount,
      userId: session.user.id,
    });
    
    return NextResponse.json({ status: "removed" });
  }
  
  // Get post to find author
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });

  if (!post) {
    return new NextResponse("Post not found", { status: 404 });
  }
  
  const like = await prisma.like.create({ data: { postId, userId: session.user.id } });
  
  // Get updated like count
  const likeCount = await prisma.like.count({ where: { postId } });
  
  // Trigger Pusher event
  await pusherServer.trigger(PostChannel(postId), "like-added", {
    postId,
    likeCount,
    userId: session.user.id,
  });

  // Create notification for post author (if not liking own post)
  await createNotification({
    userId: post.authorId,
    actorId: session.user.id,
    type: "like",
    postId,
  });
  
  return NextResponse.json({ status: "added", like });
}


