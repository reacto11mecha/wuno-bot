import { Chat } from "../lib";
import { GameModel, Game } from "../models";

import { PREFIX } from "../config/prefix";

export default async function creategame(chat: Chat) {
  if (!chat.isJoiningGame) {
    const newGame = await GameModel.create({
      gameCreatorID: chat.user!._id,
      players: [chat.user!._id],
    } as Game);

    chat.user!.gameProperty = {
      isJoiningGame: true,
      gameUID: newGame._id,
      gameID: newGame.gameID,
    };
    await chat.user!.save();

    chat.logger.info(
      `[DB] Berhasil membuat sesi game baru | ${newGame.gameID}`
    );

    await chat.replyToCurrentPerson({
      text: `Game berhasil dibuat.\nAjak teman kamu untuk bermain.\n\nPemain yang sudah tergabung\n- ${
        chat.user!.userName
      }\n\nKode: ${newGame.gameID}`,
    });
    await chat.replyToCurrentPerson({
      text: `${PREFIX}j ${newGame.gameID}`,
    });
  } else {
    await chat.replyToCurrentPerson({
      text: `Kamu sudah masuk ke sesi game: ${
        chat.isGroupChat ? "[REDACTED]" : chat.user!.gameProperty?.gameID
      }`,
    });
  }
}
