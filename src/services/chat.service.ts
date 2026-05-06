import prisma from "../utils/prisma";

type Context = {
  log: any;
};

export async function getAllChatsService(
  userId: string,
  ctx: Context
) {
  const { log } = ctx;

  log.info({ userId }, "Querying chats from DB");

  const chats = await prisma.chat.findMany({
    where: { userId },

    select: {
      id: true,
      title: true,
      sourceApp: true,
      tone: true,
      status: true,
      createdAt: true,
      messageCount: true,
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  log.info({ userId, count: chats.length }, "Chats query completed");

  return chats;
}