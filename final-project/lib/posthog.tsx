'use client';

import posthog from 'posthog-js';
import { useEffect, ReactNode } from 'react';

export function PostHogProviderWrapper({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

      if (posthogKey) {
        posthog.init(posthogKey, {
          api_host: '/ph', // Use reverse proxy path
          ui_host: 'https://us.posthog.com', // Toolbar and other UI features
          loaded: (posthog) => {
            if (process.env.NODE_ENV === 'development') {
              console.log('PostHog initialized with reverse proxy');
            }
          },
          // Enable autocapture for better tracking
          autocapture: true,
          // Capture pageviews
          capture_pageview: true,
          // Capture pageleaves
          capture_pageleave: true,
        });
      }
    }
  }, []);

  return <>{children}</>;
}

