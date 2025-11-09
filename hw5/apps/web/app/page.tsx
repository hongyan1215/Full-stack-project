import { HomeClient } from "./HomeClient";
import { auth } from "@/lib/auth";
import { prisma } from "@db/src/index";
import { redirect } from "next/navigation";

export default async function HomePage() {
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
      <HomeClient
        currentUserId={session.user.id}
        userImage={user.image}
        userUserId={user.userId}
      />
    );
  }

  return <HomeClient currentUserId={undefined} userImage={null} userUserId={null} />;
}
