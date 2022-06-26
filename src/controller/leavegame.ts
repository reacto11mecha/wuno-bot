import { isDocument, isDocumentArray } from "@typegoose/typegoose";

import { requiredJoinGameSession } from "../utils";
import { CardModel, UserModel } from "../models";

import { Game, Chat } from "../lib";

async function removeGameAuthorAndSetToNextPlayer(chat: Chat, game: Game) {
  if (isDocumentArray(game.players)) {
    const { _id: id } = game.players[0];
    const player = game.players.find(
      (player) => isDocument(player) && player._id.equals(id)
    );

    game.gameCreatorID = id;
    await game.save();

    if (isDocument(player)) {
      await Promise.all([
        chat.replyToCurrentPerson({
          text: `Anda berhasil keluar dari game. Pembuat game sudah berpindah posisi ke ${player.userName}`,
        }),
        game.sendToOtherPlayersWithoutCurrentPlayer({
          text: `${chat.message.userName} telah keluar dari game, dan posisi host sekarang berpindah ke ${player.userName}`,
        }),
      ]);
    }
  }
}

export default requiredJoinGameSession(async ({ chat, game }) => {
  const creator = await UserModel.findOne({
    _id: isDocument(game.creator) && game.creator._id,
  });
  await game.removeUserFromArray(chat.user!._id);

  if (isDocument(creator) && creator.gameProperty!.card) {
    await CardModel.deleteOne({ _id: creator.gameProperty!.card });
  }

  const nextPlayer = game.getNextPosition();

  if (game.state.PLAYING) {
    const currentPlayer = game.currentPlayer;

    // Typeguard playing state start
    if (isDocument(currentPlayer) && isDocument(nextPlayer)) {
      if (game.currentPlayerIsAuthor) {
        // Is current chatter the author and it's turn
        await Promise.all([
          (async () => {
            game.gameCreatorID = nextPlayer._id;
            await game.save();
          })(),
          game.updatePosition(nextPlayer._id),
        ]);

        const card = await CardModel.findOne({
          game: game.uid,
          user: nextPlayer._id,
        });

        await Promise.all([
          (async () => {
            const otherPlayer = nextPlayer.phoneNumber;

            await chat.sendToOtherPerson(otherPlayer, {
              text: "Kamu sekarang adalah host dari game ini, kamu juga yang saat ini dapat giliran main",
            });
            await chat.sendToOtherPerson(otherPlayer, {
              text: `Kartu saat ini: ${game.currentCard}`,
            });
            await chat.sendToOtherPerson(otherPlayer, {
              text: `Kartu kamu: ${card?.cards?.join(", ")}.`,
            });
          })(),
          chat.replyToCurrentPerson({
            text: `Anda berhasil keluar dari game. Pembuat game sudah berpindah posisi ke ${nextPlayer.userName}`,
          }),
          game.sendToOtherPlayersWithoutCurrentPlayer({
            text: `${chat.message.userName} telah keluar dari game, dan posisi host sekarang berpindah ke ${nextPlayer.userName}, saat ini giliran dia juga untuk bermain`,
          }),
        ]);
      } else if (game.isGameCreator) {
        // Is current chatter the author and not it's turn
        await removeGameAuthorAndSetToNextPlayer(chat, game);
      } else if (currentPlayer._id.equals(chat.user!._id)) {
        // Is current chatter not the author and it's turn
      } else {
        // Is current chatter not the author and not it's turn
      }
    }
    // Typeguard playing state end
  } else {
    // WAITING STATE

    // Typeguard waiting state start
    if (isDocument(creator)) {
      if (creator._id.equals(chat.user!._id) && game.players!.length > 1) {
        // Is current chatter is author and it's more than one player waiting
        await removeGameAuthorAndSetToNextPlayer(chat, game);
      } else if (
        creator._id.equals(chat.user!._id) &&
        game.players!.length < 2
      ) {
        // Is current chatter is author and less than two players waiting
        await game.endGame();

        await chat.replyToCurrentPerson({
          text: "Anda berhasil keluar dari game, tetapi karena hanya anda saja yang berada otomatis game dihentikan. Terimakasih sudah bermain!",
        });
      } else {
        // Is current chatter is not the author
        await Promise.all([
          chat.replyToCurrentPerson({
            text: "Anda berhasil keluar dari game. Terimakasih telah bermain!",
          }),
          game.sendToOtherPlayersWithoutCurrentPlayer({
            text: `${chat.message.userName} telah keluar dari game`,
          }),
        ]);
      }
    }
    // Typeguard waiting state stop
  }
});
