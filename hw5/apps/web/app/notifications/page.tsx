import { auth } from "@/lib/auth";
import { prisma } from "@db/src/index";
import { redirect } from "next/navigation";
import { NotificationsClient } from "./NotificationsClient";
import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";

export default async function NotificationsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  // Check if user needs to set up userId
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { userId: true },
  });

  if (!user?.userId) {
    redirect("/setup");
  }

  // Get notifications for current user
  const notificationsRaw = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
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

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-x-border bg-black/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="rounded-full p-2 hover:bg-x-hover transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-x-text" />
            </Link>
            <h1 className="text-xl font-bold text-x-text">Notifications</h1>
          </div>
          <button className="rounded-full p-2 hover:bg-x-hover transition-colors">
            <Settings className="h-5 w-5 text-x-text" />
          </button>
        </div>
      </div>

      {/* Notifications Content */}
      <NotificationsClient
        initialNotifications={notifications}
        initialUnreadCount={unreadCount}
        currentUserId={session.user.id}
      />
    </div>
  );
}

