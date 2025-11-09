"use client";

import PusherClient from "pusher-js";

// Initialize Pusher client only on client side
let pusherClientInstance: PusherClient | null = null;

export function getPusherClient(): PusherClient {
  if (typeof window === "undefined") {
    throw new Error("Pusher client can only be used on client side");
  }

  if (!pusherClientInstance) {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!key || !cluster) {
      throw new Error("Pusher environment variables are not set");
    }

    pusherClientInstance = new PusherClient(key, {
      cluster,
    });
  }

  return pusherClientInstance;
}

export const PostChannel = (postId: string) => `post-${postId}`;
export const UserChannel = (userId: string) => `user-${userId}`;


