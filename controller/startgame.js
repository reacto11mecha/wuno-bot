import { requiredJoinGameSession } from "../lib/validator.js";

import Card from "../models/card.js";

export default requiredJoinGameSession(async ({ chat, game }) => {
  if (game.NotFound) {
    await chat.replyToCurrentPerson("Sebuah kesalahan, game tidak ditemukan!");
    return false;
  } else if (game.isGameCreator) {
    // if (game.players.length === 1) {
    //   await chat.replyToCurrentPerson("Minimal ada dua pemain yang tergabung!");
    //   return false;
    // } else
    if (game.state.PLAYING) {
      await chat.replyToCurrentPerson("Game ini sedang dimainkan!");
      return false;
    }

    await Promise.all(
      game.players.map(
        async (player) =>
          await new Card({ user_id: player._id, game_id: game.game._id }).save()
      )
    );

    await game.startGame();

    const cards = await Card.find({ game_id: game.game._id });

    const thisPlayerCards = cards.find(({ user_id }) =>
      user_id.equals(game.currentPlayer._id)
    );

    await Promise.all([
      (async () => {
        await chat.replyToCurrentPerson(
          `Game berhasil dimulai! Sekarang giliran ${
            game.currentPlayerIsAuthor ? "kamu" : game.currentPlayer.userName
          } untuk bermain`
        );

        if (game.currentPlayerIsAuthor) {
          await chat.sendToCurrentPerson(`Kartu saat ini: ${game.currentCard}`);
          await chat.sendToCurrentPerson(
            `Kartu kamu: ${thisPlayerCards.cards.join(", ")}.`
          );
        }

        return true;
      })(),
      (async () => {
        if (!game.currentPlayerIsAuthor) {
          const toSender = `${game.currentPlayer.phoneNumber.replace(
            "+",
            ""
          )}@c.us`;

          await chat.sendToOtherPlayer(
            toSender,
            `${chat.pushname} telah memulai permainan! Sekarang giliran kamu untuk bermain`
          );
          await chat.sendToOtherPlayer(
            toSender,
            `Kartu saat ini: ${game.currentCard}`
          );
          await chat.sendToOtherPlayer(
            toSender,
            `Kartu kamu: ${thisPlayerCards.cards.join(", ")}.`
          );
        }
      })(),
      game.sendToOtherPlayersWithoutCurrentPlayer(
        `${chat.username} telah memulai permainan! Sekarang giliran ${game.currentPlayer.userName} untuk bermain`
      ),
    ]);

    chat.logger.info(`[DB] Game ${game.game.gameID} dimulai`);
  } else {
    await chat.replyToCurrentPerson(
      "Kamu bukanlah orang yang membuat sesi permainannya!"
    );
  }
});
