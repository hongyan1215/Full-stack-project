import { prisma } from "@db/src/index";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ hasUserId: false });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { userId: true },
  });

  return NextResponse.json({ hasUserId: !!user?.userId });
}
