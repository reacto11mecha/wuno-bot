import { Prisma, PrismaClient } from "@prisma/client";

export * from "@prisma/client";

const globalForPrisma = globalThis as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export type FullGameType = Prisma.GameGetPayload<{
  include: {
    winner: true;
    cards: true;
    bannedPlayers: true;
    currentPlayer: true;
    gameCreator: true;
    playerOrders: true;
    allPlayers: true;
  };
}>;

export type FullUserCardType = Prisma.UserCardGetPayload<{
  include: {
    cards: true;
  };
}>;
