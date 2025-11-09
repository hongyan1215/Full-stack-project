import { prisma } from "@db/src/index";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { postId } = await params;

    // Find and delete repost
    const repost = await prisma.repost.findFirst({
      where: {
        postId,
        userId: session.user.id,
      },
    });

    if (!repost) {
      return new NextResponse("Repost not found", { status: 404 });
    }

    await prisma.repost.delete({
      where: { id: repost.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting repost:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

