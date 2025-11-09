import "./globals.css";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Sidebar } from "@ui/index";
import { auth } from "@/lib/auth";
import { prisma } from "@db/src/index";

export const metadata: Metadata = {
  title: "N",
  description: "Nexus - A social media platform",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  let currentUserId: string | undefined;
  let currentUserDbId: string | undefined;

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { userId: true },
    });
    currentUserId = user?.userId || undefined;
    currentUserDbId = session.user.id;
  }

  return (
    <html lang="en" className="dark">
      <body className="bg-black text-x-text" suppressHydrationWarning>
        <div className="flex min-h-screen">
          <Sidebar currentUserId={currentUserId} currentUserDbId={currentUserDbId} />
          <main className="ml-20 flex-1 border-l border-x-border xl:ml-64">
            <div className="mx-auto max-w-2xl">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}


