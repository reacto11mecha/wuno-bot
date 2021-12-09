import df from "dateformat";

import { atLeastGameID } from "../lib/validator.js";

const commonCallback = async ({ chat, game }) =>
  await chat.replyToCurrentPerson(
    `Game ID: ${game.gameID}\nGame Status: ${
      game.translatedStatus
    }\nTanggal Dibuat: ${df(
      game.created_at,
      "d mmmm yyyy HH:MM:ss"
    )}\n\nPemain yang sudah tergabung:\n${game.players
      .map((player) => `- ${player.userName}`)
      .join("\n")}`
  );

export default atLeastGameID(commonCallback, commonCallback);
