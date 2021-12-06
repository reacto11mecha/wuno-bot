import df from "dateformat";

import { atLeastGameID } from "../lib/validator.js";

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

const commonCallback = async ({
  client,
  from,
  id,
  game,
  searchedGame,
  players,
}) => {
  await client.simulateTyping(from, true);

  const realGame = game || searchedGame;
  const status = getTranslatedStatus(realGame.status);

  await client.reply(
    from,
    `Game ID: ${realGame.gameID}\nGame Status: ${status}\nTanggal Dibuat: ${df(
      game.created_at,
      "d mmmm yyyy HH:MM:ss"
    )}\n\nPemain yang sudah tergabung:\n${players
      .map((g) => `- ${g.userName}`)
      .join("\n")}`,
    id,
    true
  );
  await client.simulateTyping(from, false);
};

export default atLeastGameID(commonCallback, commonCallback);
