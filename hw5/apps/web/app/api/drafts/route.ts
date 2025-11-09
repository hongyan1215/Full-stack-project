import { prisma } from "@db/src/index";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const draftSchema = z.object({
  text: z.string().max(10000),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const drafts = await prisma.draft.findMany({
      where: { authorId: session.user.id },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(drafts);
  } catch (error) {
    console.error("Error fetching drafts:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = draftSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(parsed.error.format(), { status: 400 });
    }

    const draft = await prisma.draft.create({
      data: {
        authorId: session.user.id,
        text: parsed.data.text,
      },
    });

    return NextResponse.json(draft, { status: 201 });
  } catch (error) {
    console.error("Error creating draft:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

