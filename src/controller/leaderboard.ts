import type { Chat } from "../lib";

import { prisma } from "../handler/database";
import { calcDuration } from "../utils";

export default async function leaderboard(chat: Chat) {
  const allGamesWinner = await prisma.game.findMany({
    select: { winnerId: true, started_at: true, ended_at: true },
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
      const playerAchievement = allGamesWinner
        .filter(({ winnerId }) => winnerId === playerId)
        .filter((id) => id !== null);

      return {
        playerId,
        preCalculatedAverage: playerAchievement.map(
          ({ started_at, ended_at }) =>
            ended_at!.getTime() - started_at!.getTime(),
        ),
        count: playerAchievement.length,
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

      const sumAverage = winner.preCalculatedAverage.reduce(
        (curr, acc) => curr + acc,
        0,
      );
      const averagePlayingTime =
        sumAverage / winner.preCalculatedAverage.length;

      const average = calcDuration(averagePlayingTime);

      return {
        average,
        username: user?.username ?? "????? (Pemain Sudah Dihapus)",
        count: winner.count,
      };
    }),
  );

  chat.replyToCurrentPerson(`Papan peringkat pemain saat ini
=====================
${eligibleLeaderboard
  .map(
    (winner, idx) =>
      `${idx + 1}. ${winner.username} - Menang ${
        winner.count
      } kali, rata rata durasi ${winner.average}.`,
  )
  .join("\n")
  .trim()}`);
}
