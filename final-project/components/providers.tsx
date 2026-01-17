'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { ThemeProvider } from '../contexts/ThemeContext';
import { PostHogProviderWrapper } from '../lib/posthog';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <PostHogProviderWrapper>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </PostHogProviderWrapper>
    </SessionProvider>
  );
}

