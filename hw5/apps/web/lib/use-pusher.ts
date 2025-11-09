"use client";

import { useEffect, useRef } from "react";
import { getPusherClient, PostChannel } from "./pusher-client";
import type { Channel } from "pusher-js";

interface UsePusherOptions {
  channelName: string;
  event: string;
  callback: (data: any) => void;
  enabled?: boolean;
}

export function usePusher({ channelName, event, callback, enabled = true }: UsePusherOptions) {
  const channelRef = useRef<Channel | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    try {
      // Get Pusher client
      const client = getPusherClient();

      // Subscribe to channel
      const channel = client.subscribe(channelName);
      channelRef.current = channel;

    // Create a wrapper function that uses the latest callback
    const handler = (data: any) => {
      callbackRef.current(data);
    };

    // Bind to event
    channel.bind(event, handler);

      // Cleanup
      return () => {
        if (channelRef.current) {
          try {
            channelRef.current.unbind(event, handler);
            getPusherClient().unsubscribe(channelName);
          } catch (error) {
            // Ignore errors during cleanup
          }
          channelRef.current = null;
        }
      };
    } catch (error) {
      console.error("Error setting up Pusher subscription:", error);
    }
  }, [channelName, event, enabled]);

  return channelRef.current;
}

// Helper hook for post updates
export function usePostUpdates(
  postId: string,
  callbacks: {
    onLikeAdded?: (data: { postId: string; likeCount: number; userId: string }) => void;
    onLikeRemoved?: (data: { postId: string; likeCount: number; userId: string }) => void;
    onCommentAdded?: (data: { postId: string; parentId: string | null; comment: any; replyCount: number }) => void;
  },
  enabled = true
) {
  const channelName = PostChannel(postId);

  usePusher({
    channelName,
    event: "like-added",
    callback: (data) => {
      callbacks.onLikeAdded?.(data);
    },
    enabled: enabled && !!callbacks.onLikeAdded,
  });

  usePusher({
    channelName,
    event: "like-removed",
    callback: (data) => {
      callbacks.onLikeRemoved?.(data);
    },
    enabled: enabled && !!callbacks.onLikeRemoved,
  });

  usePusher({
    channelName,
    event: "comment-added",
    callback: (data) => {
      callbacks.onCommentAdded?.(data);
    },
    enabled: enabled && !!callbacks.onCommentAdded,
  });
}

