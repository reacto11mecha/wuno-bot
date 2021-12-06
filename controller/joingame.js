import { isGroupChat } from "../lib/processMessage.js";
import { atLeastGameID } from "../lib/validator.js";

export default atLeastGameID(
  async ({
    client,
    from,
    id,
    sender,
    user,
    searchedGame,
    userNumber,
    players,
  }) => {
    await client.simulateTyping(from, true);

    if (searchedGame.status === "PLAYING") {
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
      `Berhasil join ke game "${searchedGame.gameID}", tunggu pembuat ruang game ini memulai permainannya!`,
      id,
      true
    );
    await client.simulateTyping(from, false);

    const sendTo = players
      .filter((user) => user.phoneNumber !== userNumber)
      .map((user) => `${user.phoneNumber.replace("+", "")}@c.us`);

    sendTo.forEach(async (toSender) => {
      await client.simulateTyping(toSender, true);
      await client.sendText(
        toSender,
        `Pemain dengan username "${sender.pushname}" memasuki ruang permainan! Sapa dia dengan menggunakan "U#say Halo ${sender.pushname}!"`
      );
      await client.simulateTyping(toSender, false);
    });
  },
  async ({ client, from, id, message, user }) => {
    const gc = isGroupChat(message);

    await client.simulateTyping(from, true);
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
);
