import { requiredJoinGameSession } from "../lib/validator.js";
import Card from "../models/card.js";

export default requiredJoinGameSession(async ({ chat, game, card }) => {
  const creator = Object.assign({}, game.creator)._doc;
  await game.removeUserFromArray(chat.user);

  if (game.state.PLAYING) {
    const currentPlayer = game.currentPlayer;
    const nextPlayer = game.getNextPosition();

    if (game.currentPlayerIsAuthor) {
      if (currentPlayer._id.equals(chat.user._id)) {
        await Promise.all([
          (async () => {
            game.game.gameCreatorID = nextPlayer._id;
            await game.save();
          })(),
          game.updatePosition(nextPlayer._id),
        ]);

        card.card = await Card.findOne({
          game_id: game.game._id,
          user_id: nextPlayer._id,
        });

        await Promise.all([
          (async () => {
            const otherPlayer = `${nextPlayer.phoneNumber.replace(
              "+",
              ""
            )}@c.us`;

            await chat.sendToOtherPlayer(
              otherPlayer,
              "Kamu sekarang adalah host dari game ini, kamu juga yang saat ini dapat giliran main"
            );
            await chat.sendToOtherPlayer(
              otherPlayer,
              `Kartu saat ini: ${game.currentCard}`
            );
            await chat.sendToOtherPlayer(
              otherPlayer,
              `Kartu kamu: ${card.cards.join(", ")}.`
            );
          })(),
          chat.replyToCurrentPerson(
            `Anda berhasil keluar dari game. Pembuat game sudah berpindah posisi ke ${nextPlayer.userName}`
          ),
          game.sendToOtherPlayersWithoutCurrentPlayer(
            `${chat.username} telah keluar dari game, dan posisi host sekarang berpindah ke ${nextPlayer.userName}, saat ini giliran dia juga untuk bermain`
          ),
        ]);
      } else {
        const id = game.game.players[1]._id;
        const player = game.players.find((player) => player._id.equals(id));

        game.game.gameCreatorID = id;
        await game.save();

        await Promise.all([
          chat.replyToCurrentPerson(
            `Anda berhasil keluar dari game. Pembuat game sudah berpindah posisi ke ${player.userName}`
          ),
          game.sendToOtherPlayers(
            game.players,
            `${chat.username} telah keluar dari game, dan posisi host sekarang berpindah ke ${player.userName}`
          ),
        ]);
      }
    } else if (currentPlayer._id.equals(chat.user._id)) {
      await game.updatePosition(nextPlayer._id);

      await Promise.all([
        chat.replyToCurrentPerson(
          `Anda berhasil keluar dari game. Terimakasih telah bermain!`
        ),
        chat.sendToOtherPlayers(
          game.players,
          `${chat.username} telah keluar dari game`
        ),
      ]);
    }
  } else {
    // WAITING STATE

    if (creator._id.equals(chat.user._id) && game.players.length < 2) {
      await game.endGame();

      await chat.replyToCurrentPerson(
        "Anda berhasil keluar dari game, tetapi karena hanya anda saja yang berada otomatis game dihentikan. Terimakasih sudah bermain!"
      );
    } else {
      await Promise.all([
        chat.replyToCurrentPerson(
          `Anda berhasil keluar dari game. Terimakasih telah bermain!`
        ),
        chat.sendToOtherPlayers(
          game.players,
          `${chat.username} telah keluar dari game`
        ),
      ]);
    }
  }
});
