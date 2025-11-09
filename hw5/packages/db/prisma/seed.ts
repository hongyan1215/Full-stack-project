import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  await prisma.user.deleteMany();
  await prisma.post.deleteMany();

  const alice = await prisma.user.create({
    data: {
      name: "Alice",
      userId: "alice",
      image: "https://i.pravatar.cc/150?u=alice",
      bio: "Seed user Alice",
    },
  });

  const bob = await prisma.user.create({
    data: {
      name: "Bob",
      userId: "bob",
      image: "https://i.pravatar.cc/150?u=bob",
      bio: "Seed user Bob",
    },
  });

  await prisma.post.createMany({
    data: [
      {
        authorId: alice.id,
        text: "Hello from #alice visit https://example.com",
        linkCharCount: 23,
        charCount: 11,
      },
      {
        authorId: bob.id,
        text: "Replying to @alice nice to meet you!",
        linkCharCount: 0,
        charCount: 24,
      },
    ],
  });
}

run()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });


