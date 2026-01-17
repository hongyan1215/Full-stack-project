'use client';

import posthog from 'posthog-js';

export function useTracking() {
  const track = (eventName: string, properties?: Record<string, any>) => {
    if (typeof window !== 'undefined' && posthog.__loaded) {
      posthog.capture(eventName, properties);
    }
  };

  const identify = (userId: string, properties?: Record<string, any>) => {
    if (typeof window !== 'undefined' && posthog.__loaded) {
      posthog.identify(userId, properties);
    }
  };

  const reset = () => {
    if (typeof window !== 'undefined' && posthog.__loaded) {
      posthog.reset();
    }
  };

  return { track, identify, reset };
}

