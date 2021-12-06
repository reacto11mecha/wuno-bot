import df from "dateformat";

import Game from "../models/game.js";

const getTranslatedStatus = (status) => {
  switch (status) {
    case "WAITING":
      return "Menunggu Pemain";
    case "PLAYING":
      return "Sedang Bermain";
    case "ENDING":
      return "Selesai Bermain";
    default:
      return "N/A";
  }
};

export default async function infogame({ client, from, id, args, user }) {
  await client.simulateTyping(from, true);

  let game;
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

    game = await Game.findOne({
      gameID,
    }).populate("players.user_id");
  } else {
    game = await Game.findOne({
      _id: user.gameProperty.gameUID,
      gameID: user.gameProperty.gameID,
    }).populate("players.user_id");
  }

  if (!game) {
    await client.reply(from, "Game tidak ditemukan.", id, true);
    await client.simulateTyping(from, false);
    return false;
  }

  const status = getTranslatedStatus(game.status);

  await client.reply(
    from,
    `Game ID: ${game.gameID}\nGame Status: ${status}\nTanggal Dibuat: ${df(
      game.created_at,
      "d mmmm yyyy HH:MM:ss"
    )}\n\nPemain yang sudah tergabung:\n${game.players
      .map((g) => `- ${g.user_id.userName}`)
      .join("\n")}`,
    id,
    true
  );
  await client.simulateTyping(from, false);
}
