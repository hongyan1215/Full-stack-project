import { prisma } from "@db/src/index";
import { pusherServer, UserChannel } from "@/lib/pusher-server";

interface CreateNotificationParams {
  userId: string; // 接收通知的用户
  actorId: string; // 触发通知的用户
  type: "like" | "comment" | "repost" | "follow";
  postId?: string; // 相关的帖子 ID（如果有）
}

/**
 * 创建通知
 * 不能给自己创建通知
 */
export async function createNotification({
  userId,
  actorId,
  type,
  postId,
}: CreateNotificationParams) {
  // 不能给自己创建通知
  if (userId === actorId) {
    return null;
  }

  try {
    // 创建通知
    const notification = await prisma.notification.create({
      data: {
        userId,
        actorId,
        type,
        postId: postId || null,
      },
    });

    // 获取 actor 信息
    const actor = await prisma.user.findUnique({
      where: { id: actorId },
      select: {
        id: true,
        name: true,
        userId: true,
        image: true,
      },
    });

    // 获取 post 信息（如果有）
    let post = null;
    if (postId) {
      post = await prisma.post.findUnique({
        where: { id: postId },
        select: {
          id: true,
          text: true,
          authorId: true,
        },
      });
    }

    if (!actor) {
      console.error("Actor not found for notification");
      return null;
    }

    // 构建通知对象
    const notificationWithRelations = {
      ...notification,
      actor,
      post,
    };

    // 通过 Pusher 推送通知到用户频道
    try {
      await pusherServer.trigger(UserChannel(userId), "notification-added", {
        notification: {
          id: notification.id,
          userId: notification.userId,
          type: notification.type,
          actorId: notification.actorId,
          postId: notification.postId,
          createdAt: notification.createdAt,
          readAt: notification.readAt,
          actor,
          post,
        },
      });
    } catch (pusherError) {
      // Pusher 错误不应该阻止通知创建
      console.error("Error triggering Pusher event:", pusherError);
    }

    return notificationWithRelations;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}

