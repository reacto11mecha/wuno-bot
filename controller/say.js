import Game from "../models/game.js";

export default async function say({
  client,
  from,
  id,
  args,
  user,
  userNumber,
}) {
  await client.simulateTyping(from, true);

  if (!user.gameProperty.isJoiningGame) {
    await client.reply(
      from,
      "Kamu belum masuk ke sesi game manapun!",
      id,
      true
    );
    await client.simulateTyping(from, false);
    return false;
  } else if (!args || args === "") {
    await client.reply(
      from,
      "Diperlukan pesan yang ingin dikirimkan!",
      id,
      true
    );
    await client.simulateTyping(from, false);
    return false;
  }

  const message = args.join(" ");
  const game = await Game.findOne({
    _id: user.gameProperty.gameUID,
    gameID: user.gameProperty.gameID,
  }).populate("players.user_id");

  if (!game) {
    await client.reply(
      from,
      "Sebuah kesalahan, game tidak ditemukan!",
      id,
      true
    );
    await client.simulateTyping(from, false);
    return false;
  }

  const players = game.players.map(({ user_id }) => user_id);
  const sender = players.find(({ phoneNumber }) => phoneNumber === userNumber);

  await Promise.all(
    players
      .filter((user) => user.phoneNumber !== userNumber)
      .map((user) => `${user.phoneNumber.replace("+", "")}@c.us`)
      .map(async (toSender) => {
        await client.simulateTyping(toSender, true);
        await client.sendText(toSender, `${sender.userName}: ${message}`);
        await client.simulateTyping(toSender, false);
      })
  );

  await client.reply(from, "Pesan terkirim!", id, true);
  await client.simulateTyping(from, false);
}
