"use client";
import Link from "next/link";
import { Home, User, LogOut, Bell } from "lucide-react";
import { usePathname } from "next/navigation";
import classNames from "classnames";
import { useState, useEffect } from "react";
import { PostModal } from "./PostModal";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

interface UserInfo {
  name: string | null;
  userId: string | null;
  image: string | null;
}

export function Sidebar({ 
  currentUserId, 
  currentUserDbId 
}: { 
  currentUserId?: string;
  currentUserDbId?: string;
}) {
  const pathname = usePathname();
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: null,
    userId: null,
    image: null,
  });
  const [imageError, setImageError] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (currentUserId) {
      fetch("/api/user/profile")
        .then((res) => res.json())
        .then((data) => {
          setUserInfo({
            name: data.name,
            userId: data.userId,
            image: data.image,
          });
          setImageError(false);
        })
        .catch(() => {
          // Ignore errors
        });

      // Fetch unread notification count
      fetch("/api/notifications")
        .then((res) => res.json())
        .then((data) => {
          setUnreadCount(data.unreadCount || 0);
        })
        .catch(() => {
          // Ignore errors
        });
    }
  }, [currentUserId]);

  // Subscribe to notification updates via Pusher
  useEffect(() => {
    if (!currentUserDbId || typeof window === "undefined") return;

    let pusher: any = null;
    let channel: any = null;

    // Dynamically import pusher-js to avoid SSR issues
    import("pusher-js")
      .then((PusherClient) => {
        const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
        const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

        if (!key || !cluster) {
          console.error("Pusher environment variables are not set");
          return;
        }

        pusher = new PusherClient.default(key, {
          cluster,
        });

        channel = pusher.subscribe(`user-${currentUserDbId}`);

        // Listen for new notifications
        const handleNotificationAdded = () => {
          setUnreadCount((prev) => prev + 1);
        };

        // Listen for read notifications
        const handleNotificationRead = (data: { unreadCount: number }) => {
          setUnreadCount(data.unreadCount);
        };

        channel.bind("notification-added", handleNotificationAdded);
        channel.bind("notification-read", handleNotificationRead);
      })
      .catch((error) => {
        console.error("Error setting up Pusher for notifications:", error);
      });

    return () => {
      if (channel) {
        channel.unbind("notification-added");
        channel.unbind("notification-read");
      }
      if (pusher && currentUserDbId) {
        pusher.unsubscribe(`user-${currentUserDbId}`);
        pusher.disconnect();
      }
    };
  }, [currentUserDbId]);

  const handleSignOut = () => {
    // NextAuth v5 handles signout via GET request to /api/auth/signout
    // It will redirect to the signin page after signout
    window.location.href = "/api/auth/signout";
  };

  const getInitial = () => {
    if (userInfo.name) {
      return userInfo.name.charAt(0).toUpperCase();
    }
    if (userInfo.userId) {
      return userInfo.userId.charAt(0).toUpperCase();
    }
    return null;
  };

  const NavItem = ({ href, label, icon: Icon }: { href: string; label: string; icon: any }) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        className={classNames(
          "flex items-center gap-4 rounded-full px-4 py-3 text-xl font-normal transition-colors duration-200",
          "hover:bg-[rgba(255,255,255,0.1)]",
          isActive && "font-bold"
        )}
      >
        <Icon className="h-6 w-6" />
        <span className="hidden xl:inline">{label}</span>
      </Link>
    );
  };

  return (
    <>
      <aside className="fixed left-0 top-0 flex h-screen w-20 flex-col border-r border-x-border px-2 xl:w-64 xl:px-4">
        <nav className="flex flex-col gap-1 py-2">
          <div className="mb-4 flex items-center justify-center xl:justify-start">
            <Link
              href="/"
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[rgba(255,255,255,0.1)] xl:px-4"
            >
              <img src="/N.png" alt="Nexus" className="h-6 w-6 object-contain" />
            </Link>
          </div>
          <NavItem href="/" label="Home" icon={Home} />
          {currentUserId && (
            <Link
              href="/notifications"
              className={classNames(
                "relative flex items-center gap-4 rounded-full px-4 py-3 text-xl font-normal transition-colors duration-200",
                "hover:bg-[rgba(255,255,255,0.1)]",
                pathname === "/notifications" && "font-bold"
              )}
            >
              <div className="relative">
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <span className="hidden xl:inline">Notifications</span>
            </Link>
          )}
          <NavItem
            href={currentUserId ? "/me" : "/api/auth/signin"}
            label="Profile"
            icon={User}
          />
          {currentUserId && (
            <button
              onClick={() => setPostModalOpen(true)}
              className="mt-4 flex items-center justify-center rounded-full bg-[#1D9BF0] px-4 py-3 font-bold text-white transition-colors duration-200 hover:bg-[#1a8cd8] xl:justify-start"
            >
              <span className="hidden xl:inline">Post</span>
              <span className="xl:hidden">+</span>
            </button>
          )}
        </nav>
        {currentUserId && (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="mt-auto mb-4 w-full rounded-full p-3 hover:bg-[rgba(255,255,255,0.1)] transition-colors">
                <div className="flex items-center gap-3">
                  {userInfo.image && !imageError ? (
                    <img
                      src={userInfo.image}
                      alt={userInfo.name || userInfo.userId || "User"}
                      className="h-10 w-10 rounded-full object-cover border border-x-border"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-x-border flex items-center justify-center border border-x-border">
                      {getInitial() ? (
                        <span className="text-sm font-bold text-x-text">
                          {getInitial()}
                        </span>
                      ) : (
                        <User className="h-5 w-5 text-x-textSecondary" />
                      )}
                    </div>
                  )}
                  <div className="hidden flex-col xl:flex flex-1 min-w-0">
                    <span className="text-sm font-bold text-x-text truncate">
                      {userInfo.name || userInfo.userId || "User"}
                    </span>
                    {userInfo.userId && (
                      <span className="text-xs text-x-textSecondary truncate">
                        @{userInfo.userId}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="min-w-[200px] rounded-lg bg-black border border-x-border p-1 shadow-lg z-50"
                align="start"
                side="top"
                sideOffset={8}
              >
                <DropdownMenu.Item
                  asChild
                  className="flex items-center gap-3 px-4 py-2 rounded-md text-x-text hover:bg-x-hover cursor-pointer outline-none"
                >
                  <Link href="/me">
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="h-px bg-x-border my-1" />
                <DropdownMenu.Item
                  onClick={handleSignOut}
                  className="flex items-center gap-3 px-4 py-2 rounded-md text-red-500 hover:bg-red-500/10 cursor-pointer outline-none"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        )}
      </aside>
      <PostModal open={postModalOpen} onOpenChange={setPostModalOpen} userImage={userInfo.image} />
    </>
  );
}


