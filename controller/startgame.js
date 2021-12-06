import { requiredJoinGameSession } from "../lib/validator.js";
import shuffleArray from "../utils/shuffleArray.js";

export default requiredJoinGameSession(
  async ({ client, from, id, user, sender, userNumber, game, creator }) => {
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

      const shuffledPlayer = shuffleArray(game.players).map(
        ({ user_id }) => user_id
      );
      const currentPlayer = shuffledPlayer[0];

      const sendTo = game.players
        .map(({ user_id: user }) => user)
        .filter((user) => user.phoneNumber !== userNumber)
        .filter((user) => user.phoneNumber !== currentPlayer.phoneNumber);
      const currentPlayerIsAuthor = creator._id.equals(currentPlayer._id);

      game.status = "PLAYING";
      game.startTime = Date.now();
      game.playerOrder = shuffledPlayer.map(({ _id }) => ({ _id }));

      await game.save();

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
          await client.simulateTyping(from, false);
          return true;
        })(),
        (async () => {
          if (!currentPlayerIsAuthor) {
            const toSender = `${currentPlayer.phoneNumber.replace(
              "+",
              ""
            )}@c.us`;

            await client.simulateTyping(toSender, true);
            await client.sendText(
              toSender,
              `${sender.pushname} telah memulai permainan! Sekarang giliran kamu untuk bermain`
            );
            await client.simulateTyping(toSender, false);
          }
        })(),
        ...sendTo
          .filter(({ _id }) => !_id.equals(currentPlayer._id))
          .map((user) => `${user.phoneNumber.replace("+", "")}@c.us`)
          .map(async (toSender) => {
            await client.simulateTyping(toSender, true);
            await client.sendText(
              toSender,
              `${sender.pushname} telah memulai permainan! Sekarang giliran ${currentPlayer.userName} untuk bermain`
            );
            await client.simulateTyping(toSender, false);
          }),
      ]);
    }
  }
);
