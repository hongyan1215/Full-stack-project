"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, Repeat2, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Actor {
  id: string;
  name: string | null;
  userId: string | null;
  image: string | null;
}

interface Post {
  id: string;
  text: string;
  authorId: string;
}

interface Notification {
  id: string;
  userId: string;
  type: "like" | "comment" | "repost" | "follow";
  actorId: string;
  postId: string | null;
  createdAt: Date | string;
  readAt: Date | string | null;
  actor: Actor | null;
  post: Post | null;
}

interface NotificationsClientProps {
  initialNotifications: Notification[];
  initialUnreadCount: number;
  currentUserId: string;
}

export function NotificationsClient({
  initialNotifications,
  initialUnreadCount,
  currentUserId,
}: NotificationsClientProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [loading, setLoading] = useState(false);

  // Subscribe to Pusher for real-time updates
  useEffect(() => {
    if (typeof window === "undefined") return;

    import("pusher-js").then((PusherClient) => {
      const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
      const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

      if (!key || !cluster) {
        console.error("Pusher environment variables are not set");
        return;
      }

      const pusher = new PusherClient.default(key, {
        cluster,
      });

      const channel = pusher.subscribe(`user-${currentUserId}`);

      // Listen for new notifications
      const handleNotificationAdded = (data: { notification: Notification }) => {
        setNotifications((prev) => [data.notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      };

      // Listen for read notifications
      const handleNotificationRead = (data: { unreadCount: number }) => {
        setUnreadCount(data.unreadCount);
        // Refresh notifications to update read status
        router.refresh();
      };

      channel.bind("notification-added", handleNotificationAdded);
      channel.bind("notification-read", handleNotificationRead);

      return () => {
        channel.unbind("notification-added", handleNotificationAdded);
        channel.unbind("notification-read", handleNotificationRead);
        pusher.unsubscribe(`user-${currentUserId}`);
        pusher.disconnect();
      };
    }).catch((error) => {
      console.error("Error setting up Pusher for notifications:", error);
    });
  }, [currentUserId, router]);

  const handleMarkAllAsRead = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });

      if (res.ok) {
        // Update local state
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, readAt: n.readAt || new Date() }))
        );
        setUnreadCount(0);
        router.refresh();
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.readAt && notification.postId) {
      try {
        await fetch("/api/notifications", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationIds: [notification.id] }),
        });
        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, readAt: new Date() } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }

    // Navigate to post if it exists
    if (notification.postId) {
      router.push(`/post/${notification.postId}`);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-5 w-5 fill-red-500 text-red-500" />;
      case "comment":
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case "repost":
        return <Repeat2 className="h-5 w-5 text-green-500" />;
      case "follow":
        return <UserIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <UserIcon className="h-5 w-5 text-x-textSecondary" />;
    }
  };

  const getNotificationText = (type: string) => {
    switch (type) {
      case "like":
        return "liked your post";
      case "comment":
        return "commented on your post";
      case "repost":
        return "reposted your post";
      case "follow":
        return "followed you";
      default:
        return "New notification";
    }
  };

  return (
    <div className="min-h-screen">
      {/* Mark all as read button */}
      {unreadCount > 0 && (
        <div className="border-b border-x-border px-4 py-3">
          <button
            onClick={handleMarkAllAsRead}
            disabled={loading}
            className="text-sm text-blue-500 hover:underline disabled:opacity-50"
          >
            Mark all as read
          </button>
        </div>
      )}

      {/* Notifications List */}
      <div className="divide-y divide-x-border">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-x-textSecondary">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`flex gap-3 px-4 py-3 hover:bg-x-hover cursor-pointer transition-colors ${
                !notification.readAt ? "bg-blue-500/10" : ""
              }`}
            >
              {/* Icon */}
              <div className="flex-shrink-0 mt-1">
                {getNotificationIcon(notification.type)}
              </div>

              {/* Actor Avatar */}
              <div className="flex-shrink-0">
                {notification.actor?.image ? (
                  <img
                    src={notification.actor.image}
                    alt={notification.actor.name || notification.actor.userId || "User"}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-x-border flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-x-textSecondary" />
                  </div>
                )}
              </div>

              {/* Notification Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <p className="text-x-text">
                      <span className="font-bold">
                        {notification.actor?.name || notification.actor?.userId || "Someone"}
                      </span>{" "}
                      {getNotificationText(notification.type)}
                    </p>
                    {notification.post && (
                      <p className="text-x-textSecondary text-sm mt-1 line-clamp-2">
                        {notification.post.text}
                      </p>
                    )}
                    <p className="text-x-textSecondary text-xs mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  {!notification.readAt && (
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2" />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

