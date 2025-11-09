import { PostThread } from "./PostThread";
import { auth } from "@/lib/auth";
import { prisma } from "@db/src/index";
import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function PostPermalinkPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  // Check if user needs to set up userId
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { userId: true, image: true },
    });

    if (!user?.userId) {
      redirect("/setup");
    }

    return (
      <PostThread
        postId={id}
        currentUserId={session.user.id}
        userImage={user.image}
      />
    );
  }

  return <PostThread postId={id} currentUserId={undefined} userImage={null} />;
}
