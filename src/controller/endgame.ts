import { requiredJoinGameSession } from "../utils";
import { isDocument } from "@typegoose/typegoose";

import { GameModel } from "../models";

export default requiredJoinGameSession(async ({ chat, game }) => {
  if (game.NotFound) {
    await chat.replyToCurrentPerson({ text: "Game tidak ditemukan." });
  } else if (game.isGameCreator) {
    if (!game.state.ENDED) {
      const gameClone = await GameModel.findOne({ gameID: game.gameID });
      const creatorUsername =
        isDocument(game.creator) && game.creator.userName.slice();

      await game.endGame();

      await Promise.all([
        game.sendToOtherPlayersWithoutCurrentPerson(
          {
            text: `${creatorUsername} telah menghentikan permainan. Terimakasih sudah bermain!`,
          },
          gameClone!.players
        ),
        chat.replyToCurrentPerson({
          text: "Game berhasil dihentikan. Terimakasih sudah bermain!",
        }),
      ]);
    } else {
      await chat.replyToCurrentPerson({ text: "Game sudah dihentikan!" });
    }
  } else {
    await chat.replyToCurrentPerson({
      text: "Kamu bukan orang yang membuat gamenya!",
    });
  }
});
