import { requiredJoinGameSession } from "../lib/validator.js";
import shuffleArray from "../utils/shuffleArray.js";

import Card from "../models/card.js";

export default requiredJoinGameSession(
  async ({
    client,
    from,
    id,
    user,
    sender,
    userNumber,
    players,
    game,
    creator,
    logger,
  }) => {
    await client.simulateTyping(from, true);

    if (!game) {
      await client.reply(
        from,
        "Sebuah kesalahan, game tidak ditemukan!",
        id,
        true
      );
      await client.simulateTyping(from, false);
      return false;
    } else if (game.gameCreatorID.equals(user._id)) {
      if (game.players.length === 1) {
        await client.reply(
          from,
          "Minimal ada dua pemain yang tergabung!",
          id,
          true
        );
        await client.simulateTyping(from, false);
        return false;
      } else if (game.status === "PLAYING") {
        await client.reply(from, "Game ini sedang dimainkan!", id, true);
        await client.simulateTyping(from, false);
        return false;
      }

      const shuffledPlayer = shuffleArray(players);
      const currentPlayer = shuffledPlayer[0];

      const sendTo = players
        .filter((user) => user.phoneNumber !== userNumber)
        .filter((user) => user.phoneNumber !== currentPlayer.phoneNumber);
      const currentPlayerIsAuthor = creator._id.equals(currentPlayer._id);

      game.status = "PLAYING";
      game.startTime = Date.now();
      game.playerOrder = shuffledPlayer.map(({ _id }) => ({ _id }));

      await game.save();

      await Promise.all(
        players.map(
          async (player) =>
            await new Card({ user_id: player._id, game_id: game._id }).save()
        )
      );

      const cards = await Card.find({ game_id: game._id });

      await Promise.all([
        (async () => {
          await client.reply(
            from,
            `Game berhasil dimulai! Sekarang giliran ${
              currentPlayerIsAuthor ? "kamu" : currentPlayer.userName
            } untuk bermain`,
            id,
            true
          );
          if (currentPlayerIsAuthor) {
            const thisPlayerCards = cards.find(({ user_id }) =>
              user_id.equals(currentPlayer._id)
            );
            await client.sendText(
              from,
              `Kartu kamu: ${thisPlayerCards.cards.join(", ")}.`,
              true
            );
          }

          await client.simulateTyping(from, false);
          return true;
        })(),
        (async () => {
          if (!currentPlayerIsAuthor) {
            const toSender = `${currentPlayer.phoneNumber.replace(
              "+",
              ""
            )}@c.us`;
            const thisPlayerCards = cards.find(({ user_id }) =>
              user_id.equals(currentPlayer._id)
            );

            await client.simulateTyping(toSender, true);

            await client.sendText(
              toSender,
              `${sender.pushname} telah memulai permainan! Sekarang giliran kamu untuk bermain`
            );
            await client.sendText(
              `Kartu kamu: ${thisPlayerCards.cards.join(", ")}.`
            );

            await client.simulateTyping(toSender, false);
          }
        })(),
        ...sendTo
          .filter(({ _id }) => !_id.equals(currentPlayer._id))
          .map((user) => ({
            ...user,
            toSender: `${user.phoneNumber.replace("+", "")}@c.us`,
          }))
          .map(async (user) => {
            await client.simulateTyping(user.toSender, true);

            await client.sendText(
              user.toSender,
              `${sender.pushname} telah memulai permainan! Sekarang giliran ${currentPlayer.userName} untuk bermain`
            );

            await client.simulateTyping(user.toSender, false);
          }),
      ]);

      logger.info(`[DB] Game ${game.gameID} dimulai`);
    }
  }
);
