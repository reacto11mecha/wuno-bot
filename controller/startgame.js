import Game from "../models/game.js";

import shuffleArray from "../utils/shuffleArray.js";

export default async function startgame({
  client,
  from,
  id,
  user,
  sender,
  userNumber,
}) {
  await client.simulateTyping(from, true);

  if (user.gameProperty.isJoiningGame) {
    const game = await Game.findOne({
      _id: user.gameProperty.gameUID,
      gameID: user.gameProperty.gameID,
    }).populate("players.user_id");
    const creator = game.players.find(({ user_id: user }) =>
      game.gameCreatorID.equals(user._id)
    ).user_id;

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
      // if (game.players.length === 1) {
      //   await client.reply(
      //     from,
      //     "Minimal ada dua pemain yang tergabung!",
      //     id,
      //     true
      //   );
      //   await client.simulateTyping(from, false);
      // } else
      if (game.status === "PLAYING") {
        await client.reply(from, "Game ini sedang dimainkan!", id, true);
        await client.simulateTyping(from, false);
      }

      const shuffledPlayer = shuffleArray(game.players).map(
        ({ user_id }) => user_id
      );
      const currentPlayer = shuffledPlayer[0];

      const sendTo = game.players
        .map(({ user_id: user }) => user)
        .filter((user) => user.phoneNumber !== userNumber)
        .filter((user) => user.phoneNumber !== currentPlayer.phoneNumber)
        .map((user) => `${user.phoneNumber.replace("+", "")}@c.us`);
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
  } else {
    await client.reply(
      from,
      "Kamu belum masuk ke sesi game manapun!",
      id,
      true
    );
    await client.simulateTyping(from, false);
  }
}
