import { atLeastGameID, df, type commonCb } from "../utils";

import { isDocument } from "@typegoose/typegoose";
// import { User } from "../models"

const commonCallback: commonCb = async ({ chat, game }) =>
  await chat.replyToCurrentPerson({
    text: `Game ID: ${game.gameID}\nGame Status: ${
      game.translatedStatus
    }\nTanggal Dibuat: ${df(
      game.created_at!
    )}\n\nPemain yang sudah tergabung:\n${game
      .players!.map((player) => isDocument(player) && `- ${player.userName}`)
      .join("\n")}`,
  });

export default atLeastGameID(commonCallback, commonCallback);
