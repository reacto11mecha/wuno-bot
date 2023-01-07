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

    await game.setCreatorId(id);

    if (isDocument(player)) {
      await Promise.all([
        chat.replyToCurrentPerson(
          `Anda berhasil keluar dari game. Pembuat game sudah berpindah posisi ke ${player.userName}`
        ),
        game.sendToOtherPlayersWithoutCurrentPlayer(
          `${chat.message.userName} telah keluar dari game, dan posisi host sekarang berpindah ke ${player.userName}`
        ),
      ]);
    }
  }
}

export default requiredJoinGameSession(async ({ chat, game }) => {
  const creator = await UserModel.findOne({
    _id: isDocument(game.creator) && game.creator._id,
  });
  await game.removeUserFromArray(chat.user!._id);

  const nextPlayer = game.getNextPosition();

  if (game.state.PLAYING) {
    const currentPlayer = game.currentPlayer;

    // Check if players is less than two person
    if (game.players!.length < 2) {
      await game.endGame();

      await Promise.all([
        chat.replyToCurrentPerson(
          "Anda berhasil keluar dari permainan, tetapi karena pemain kurang dari dua orang maka game otomatis dihentikan. Terimakasih sudah bermain!"
        ),
        game.sendToOtherPlayersWithoutCurrentPlayer(
          `Pemain ${chat.message.userName} sudah keluar dari permainan, tetapi karena pemain kurang dari dua orang maka game otomatis dihentikan. Terimakasih sudah bermain!`
        ),
      ]);

      return;
    }

    // Typeguard playing state start
    if (isDocument(currentPlayer) && isDocument(nextPlayer)) {
      if (game.currentPlayerIsAuthor) {
        // Is current chatter the author and it's turn
        await game.setCreatorId(nextPlayer._id);

        await game.updatePosition(nextPlayer._id);

        const card = await CardModel.findOne({
          game: game.uid,
          user: nextPlayer._id,
        });

        await Promise.all([
          (async () => {
            const otherPlayer = nextPlayer.phoneNumber;

            await chat.sendToOtherPerson(
              otherPlayer,
              "Kamu sekarang adalah host dari game ini, kamu juga yang saat ini dapat giliran main"
            );
            await chat.sendToOtherPerson(
              otherPlayer,
              `Kartu saat ini: ${game.currentCard}`
            );
            await chat.sendToOtherPerson(
              otherPlayer,
              `Kartu kamu: ${card?.cards?.join(", ")}.`
            );
          })(),
          chat.replyToCurrentPerson(
            `Anda berhasil keluar dari game. Pembuat game sudah berpindah posisi ke ${nextPlayer.userName}`
          ),
          game.sendToOtherPlayersWithoutCurrentPlayer(
            `${chat.message.userName} telah keluar dari game, dan posisi host sekarang berpindah ke ${nextPlayer.userName}, saat ini giliran dia juga untuk bermain`
          ),
        ]);
      } else if (game.isGameCreator) {
        // Is current chatter the author and not it's turn
        await removeGameAuthorAndSetToNextPlayer(chat, game);
      } else if (game.isCurrentChatTurn) {
        // Is current chatter not the author and it's turn
        await game.updatePosition(nextPlayer._id);

        const card = await CardModel.findOne({
          game: game.uid,
          user: nextPlayer._id,
        });

        await Promise.all([
          (async () => {
            const otherPlayer = nextPlayer.phoneNumber;

            await chat.sendToOtherPerson(
              otherPlayer,
              `${chat.message.userName} telah keluar dari game, selanjutnya adalah giliran kamu untuk bermain`
            );
            await chat.sendToOtherPerson(
              otherPlayer,
              `Kartu saat ini: ${game.currentCard}`
            );
            await chat.sendToOtherPerson(
              otherPlayer,
              `Kartu kamu: ${card?.cards?.join(", ")}.`
            );
          })(),
          chat.replyToCurrentPerson(
            `Anda berhasil keluar dari game. Pembuat game sudah berpindah posisi ke ${nextPlayer.userName}`
          ),
          game.sendToOtherPlayersWithoutCurrentPlayer(
            `${chat.message.userName} telah keluar dari game, selanjutnya adalah giliran ${nextPlayer.userName} untuk bermain`
          ),
        ]);
      } else {
        // Is current chatter not the author and not it's turn
        await Promise.all([
          chat.replyToCurrentPerson(
            "Anda berhasil keluar dari game. Terimakasih telah bermain!"
          ),
          game.sendToOtherPlayersWithoutCurrentPlayer(
            `${chat.message.userName} telah keluar dari game`
          ),
        ]);
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

        await chat.replyToCurrentPerson(
          "Anda berhasil keluar dari game, tetapi karena hanya anda saja yang berada otomatis game dihentikan. Terimakasih sudah bermain!"
        );
      } else {
        // Is current chatter is not the author
        await Promise.all([
          chat.replyToCurrentPerson(
            "Anda berhasil keluar dari game. Terimakasih telah bermain!"
          ),
          game.sendToOtherPlayersWithoutCurrentPlayer(
            `${chat.message.userName} telah keluar dari game`
          ),
        ]);
      }
    }
    // Typeguard waiting state stop
  }
});
