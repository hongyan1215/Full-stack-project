import NextAuth from 'next-auth';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import clientPromise from '@/lib/mongodb';
import { authConfig } from './auth.config';

// Keep database name consistent across adapter and custom queries
const dbName = process.env.MONGODB_DB_NAME || 'calendar-app';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: MongoDBAdapter(clientPromise, { databaseName: dbName }),
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile }) {
      // Ensure account record is created in MongoDB for OAuth providers
      // MongoDBAdapter should handle this automatically, but we can add logging
      if (account?.provider && account.provider !== 'credentials') {
        console.log(`User signed in with ${account.provider}:`, user.email);
      }
      return true;
    },
    async session({ session, user, token }) {
      // Add provider info to session if available
      if (token?.provider) {
        // Type assertion to allow adding provider property
        (session.user as any).provider = token.provider as string;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      // Store provider info in JWT token
      if (account?.provider) {
        token.provider = account.provider;
      }
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
  },
});

