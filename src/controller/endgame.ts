import { requiredJoinGameSession } from "../utils";
import { isDocument } from "@typegoose/typegoose";

import { GameModel } from "../models";

export default requiredJoinGameSession(async ({ chat, game }) => {
  if (game.NotFound) {
    await chat.replyToCurrentPerson("Game tidak ditemukan.");
  } else if (game.isGameCreator) {
    if (!game.state.ENDED) {
      const gameClone = await GameModel.findOne({ gameID: game.gameID });
      const creatorUsername =
        isDocument(game.creator) && game.creator.userName.slice();

      await game.endGame();

      await Promise.all([
        game.sendToOtherPlayersWithoutCurrentPerson(
          `${creatorUsername} telah menghentikan permainan. Terimakasih sudah bermain!`,
          gameClone!.players
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
