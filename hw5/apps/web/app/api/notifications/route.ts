import { prisma } from "@db/src/index";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { pusherServer, UserChannel } from "@/lib/pusher-server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Get notifications for current user
    const notificationsRaw = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50, // Limit to 50 most recent notifications
    });

    // Get unique actor IDs and post IDs
    const actorIds = [...new Set(notificationsRaw.map((n) => n.actorId))];
    const postIds = [
      ...new Set(notificationsRaw.map((n) => n.postId).filter((id): id is string => !!id)),
    ];

    // Fetch actors and posts
    const actors = await prisma.user.findMany({
      where: { id: { in: actorIds } },
      select: {
        id: true,
        name: true,
        userId: true,
        image: true,
      },
    });

    const posts = postIds.length > 0
      ? await prisma.post.findMany({
          where: { id: { in: postIds } },
          select: {
            id: true,
            text: true,
            authorId: true,
          },
        })
      : [];

    // Create maps for quick lookup
    const actorMap = new Map(actors.map((a) => [a.id, a]));
    const postMap = new Map(posts.map((p) => [p.id, p]));

    // Combine notifications with actor and post data
    const notifications = notificationsRaw.map((notification) => ({
      ...notification,
      actor: actorMap.get(notification.actorId) || null,
      post: notification.postId ? postMap.get(notification.postId) || null : null,
    }));

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        readAt: null,
      },
    });

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
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
    const { notificationIds, all } = body;

    if (all) {
      // Mark all notifications as read
      await prisma.notification.updateMany({
        where: {
          userId: session.user.id,
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      });
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: session.user.id, // Ensure user can only mark their own notifications
        },
        data: {
          readAt: new Date(),
        },
      });
    } else {
      return new NextResponse("Invalid request body", { status: 400 });
    }

    // Get updated unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        readAt: null,
      },
    });

    // Trigger Pusher event to update unread count
    try {
      await pusherServer.trigger(UserChannel(session.user.id), "notification-read", {
        unreadCount,
      });
    } catch (pusherError) {
      console.error("Error triggering Pusher event:", pusherError);
    }

    return NextResponse.json({ success: true, unreadCount });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

