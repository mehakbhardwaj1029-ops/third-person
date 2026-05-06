import prisma from "../utils/prisma";

export async function getAllChatsService(userId: string) {
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

  return chats;
}