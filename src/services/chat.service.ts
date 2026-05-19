import prisma from "../utils/prisma";

type Context = {
  log: any;
};

export async function getAllChatsService(
  userId: string,
  limit = 20,
  cursor?: string,
  sortOrder: "asc" | "desc" = "desc",
  search?: string,
  ctx?: Context
) {
  const { log } = ctx!;

  log.info(
    {
      userId,
      limit,
      cursor,
      sortOrder,
      search
    },
    "Querying chats from DB"
  );

  const normalizedSearch = search?.trim();

  const chats = await prisma.chat.findMany({
  where: {
    userId,

    ...(normalizedSearch && {
      title: {
        contains: normalizedSearch,
        mode: "insensitive",
      },
    }),
  },

  take: limit,

  ...(cursor && {
    cursor: {
      id: cursor,
    },
    skip: 1,
  }),

  orderBy: [
    {
      createdAt: sortOrder,
    },
    {
      id: sortOrder,
    },
  ],

  select: {
    id: true,
    fileHash: true,
    title: true,
    sourceApp: true,
    tone: true,
    status: true,
    createdAt: true,
    messageCount: true,
  },
});

  const hasMore = chats.length === limit;

  const nextCursor = hasMore
    ? chats[chats.length - 1].id
    : null;

  log.info(
    {
      userId,
      count: chats.length,
      hasMore,
      nextCursor,
    },
    "Chats query completed"
  );

  return {
    chats,
    nextCursor,
    hasMore,
  };
}