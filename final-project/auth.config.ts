import type { NextAuthConfig } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/calendar.readonly',
        },
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Local Dev',
      credentials: {
        username: { label: "Username", type: "text", placeholder: "dev" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Only for development/testing
        if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENABLE_TEST_AUTH === 'true') {
          return {
            id: 'dev-user-1',
            name: 'Dev User',
            email: 'dev@example.com',
            image: 'https://github.com/shadcn.png',
          };
        }
        return null;
      }
    }),
  ],
  session: {
    strategy: 'jwt', // Use JWT for credentials provider compatibility
  },
} satisfies NextAuthConfig;

