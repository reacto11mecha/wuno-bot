import { Types } from "mongoose";

import { Chat } from "../lib";
import { GameModel as Game } from "../models";

export default async function creategame(chat: Chat) {
  if (!chat.isJoiningGame) {
    const newGame = new Game({ gameCreatorID: chat.user!._id });
    newGame.players.push({ user_id: chat.user!._id });

    chat.user!.gameProperty.isJoiningGame = true;
    chat.user!.gameProperty.gameUID = newGame._id;
    chat.user!.gameProperty.gameID = newGame.gameID;

    await Promise.all([chat.user!.save(), newGame.save()]);

    chat.logger.info(
      `[DB] Berhasil membuat sesi game baru | ${newGame.gameID}`
    );

    await chat.replyToCurrentPerson({
      text: `Game berhasil dibuat.\nAjak teman kamu untuk bermain.\n\nPemain yang sudah tergabung\n- ${
        chat.user!.userName
      }\n\nKode: ${newGame.gameID}`,
    });
    await chat.replyToCurrentPerson({
      text: `${process.env.PREFIX || "U#"}j ${newGame.gameID}`,
    });
  } else {
    await chat.replyToCurrentPerson({
      text: `Kamu sudah masuk ke sesi game: ${
        chat.isGroupChat ? "[REDACTED]" : chat.user!.gameProperty.gameID
      }`,
    });
  }
}
