import { prisma } from "@db/src/index";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { userId } = await req.json();

  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  // Validate userId format (alphanumeric and underscores only, 3-15 chars)
  if (!/^[a-zA-Z0-9_]{3,15}$/.test(userId)) {
    return NextResponse.json(
      { error: "userId must be 3-15 characters (letters, numbers, underscores only)" },
      { status: 400 }
    );
  }

  // Check if userId is already taken
  const existing = await prisma.user.findUnique({
    where: { userId },
  });

  if (existing) {
    return NextResponse.json({ error: "This username is already taken" }, { status: 409 });
  }

  // Update user
  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { userId },
  });

  return NextResponse.json({ userId: user.userId });
}
