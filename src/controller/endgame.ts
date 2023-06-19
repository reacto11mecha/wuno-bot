import { requiredJoinGameSession } from "../utils";

import { prisma } from "../lib/database";

export default requiredJoinGameSession(async ({ chat, game }) => {
  if (game.NotFound) {
    await chat.replyToCurrentPerson("Game tidak ditemukan.");
  } else if (game.isGameCreator) {
    if (!game.state.ENDED) {
      const gameClone = await prisma.game.findUnique({
        where: {
          gameID: game.gameID,
        },
        include: {
          allPlayers: true,
        },
      });

      const creator = await game.getCreatorUser();

      await game.endGame();

      await Promise.all([
        game.sendToOtherPlayersWithoutCurrentPerson(
          `${creator?.username} telah menghentikan permainan. Terimakasih sudah bermain!`,
          gameClone!.allPlayers
        ),
        chat.replyToCurrentPerson(
          "Game berhasil dihentikan. Terimakasih sudah bermain!"
        ),
      ]);
    } else {
      await chat.replyToCurrentPerson("Game sudah dihentikan!");
    }
  } else {
    await chat.replyToCurrentPerson("Kamu bukan orang yang membuat gamenya!");
  }
});
