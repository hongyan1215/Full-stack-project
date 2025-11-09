import { prisma } from "@db/src/index";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const draftSchema = z.object({
  text: z.string().max(10000),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = draftSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(parsed.error.format(), { status: 400 });
    }

    // Check if draft exists and belongs to user
    const existingDraft = await prisma.draft.findUnique({
      where: { id },
    });

    if (!existingDraft) {
      return new NextResponse("Draft not found", { status: 404 });
    }

    if (existingDraft.authorId !== session.user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const draft = await prisma.draft.update({
      where: { id },
      data: { text: parsed.data.text },
    });

    return NextResponse.json(draft);
  } catch (error) {
    console.error("Error updating draft:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { id } = await params;

    // Check if draft exists and belongs to user
    const existingDraft = await prisma.draft.findUnique({
      where: { id },
    });

    if (!existingDraft) {
      return new NextResponse("Draft not found", { status: 404 });
    }

    if (existingDraft.authorId !== session.user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    await prisma.draft.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting draft:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

