import type { Chat } from "../lib";

import { prisma } from "../handler/database";

export default async function leaderboard(chat: Chat) {
  const allGamesWinner = await prisma.game.findMany({
    select: { winnerId: true },
    where: {
      winnerId: {
        not: null,
      },
    },
  });

  const allWinnersId = [
    ...new Set(allGamesWinner.map(({ winnerId }) => winnerId)),
  ];

  const winningCount = allWinnersId
    .map((playerId) => {
      const countArray = allGamesWinner
        .filter(({ winnerId }) => winnerId === playerId)
        .filter((id) => id !== null);

      return {
        playerId,
        count: countArray.length,
      };
    })
    .sort((a, b) => b.count - a.count);

  const eligibleLeaderboard = await Promise.all(
    winningCount.slice(0, 10).map(async (winner) => {
      const user = await prisma.user.findUnique({
        select: {
          username: true,
        },
        where: {
          id: winner.playerId!,
        },
      });

      return {
        username: user!.username,
        count: winner.count,
      };
    })
  );

  chat.replyToCurrentPerson(`Papan leaderboard saat ini
${eligibleLeaderboard
  .map(
    (winner, idx) =>
      `${idx + 1}. ${winner.username} - Menang ${winner.count} kali`
  )
  .join("\n")
  .trim()}`);
}
