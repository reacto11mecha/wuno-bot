import Game from "../models/game.js";

import { isGroupChat } from "../lib/processMessage.js";

export default async function joingame({
  client,
  from,
  id,
  sender,
  args,
  user,
  message,
  userNumber,
}) {
  await client.simulateTyping(from, true);

  const gc = isGroupChat(message);
  const gameID = args[0];

  if (!user.gameProperty.isJoiningGame) {
    if (!gameID || gameID === "") {
      await client.reply(from, "Diperlukan parameter game id!", id, true);
      await client.simulateTyping(from, false);
      return false;
    } else if (gameID.length < 11) {
      await client.reply(
        from,
        "Minimal panjang game id adalah 11 karakter!",
        id,
        true
      );
      await client.simulateTyping(from, false);
      return false;
    }

    const searchedGame = await Game.findOne({
      gameID,
    });

    if (!searchedGame) {
      await client.reply(from, "Game tidak ditemukan.", id, true);
      await client.simulateTyping(from, false);
      return false;
    } else if (searchedGame.status === "PLAYING") {
      await client.reply(
        from,
        "Game ini sedang bermain, konfirmasikan ke orang yang membuat game atau tunggu giliran selanjutnya!",
        id,
        true
      );
      await client.simulateTyping(from, false);
      return false;
    } else if (searchedGame.status === "ENDING") {
      await client.reply(from, "Game ini sudah selesai!", id, true);
      await client.simulateTyping(from, false);
      return false;
    }

    searchedGame.players.push({ user_id: user._id });

    user.gameProperty.isJoiningGame = true;
    user.gameProperty.gameUID = searchedGame._id;
    user.gameProperty.gameID = searchedGame.gameID;

    await Promise.all([user.save(), searchedGame.save()]);

    await client.reply(
      from,
      `Berhasil join ke game "${gameID}", tunggu pembuat ruang game ini memulai permainannya!`,
      id,
      true
    );
    await client.simulateTyping(from, false);

    const sendTo = await Game.findOne({ _id: searchedGame._id })
      .populate("players.user_id")
      .then((e) =>
        e.players
          .filter(({ user_id: user }) => user.phoneNumber !== userNumber)
          .map(
            ({ user_id: user }) => `${user.phoneNumber.replace("+", "")}@c.us`
          )
      );

    sendTo.forEach(async (toSender) => {
      await client.simulateTyping(toSender, true);
      await client.sendText(
        toSender,
        `Pemain dengan username "${sender.pushname}" memasuki ruang permainan! Sapa dia dengan menggunakan "U#say Halo ${sender.pushname}!"`
      );
      await client.simulateTyping(toSender, false);
    });
  } else {
    await client.reply(
      from,
      `Kamu sudah masuk ke sesi game ${
        gc ? "[REDACTED]" : user.gameProperty.gameID
      }\n`,
      id,
      true
    );

    await client.simulateTyping(from, false);
  }
}
