import { nanoid } from "nanoid";

import { Chat } from "../lib";
import { GameModel, Game } from "../models";

import { cards } from "../config/cards";
import { random } from "../utils";

const appropriateInitialCards = cards
  .filter((e) => !e.startsWith("wild"))
  .filter((e) => !e.endsWith("skip"))
  .filter((e) => !e.endsWith("draw2"))
  .filter((e) => !e.endsWith("reverse"));

const getIntialCard = () => {
  const idx = Math.floor(random() * appropriateInitialCards.length);
  return appropriateInitialCards[idx];
};

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
      text: `${process.env.PREFIX || "U#"}j ${newGame.gameID}`,
    });
  } else {
    await chat.replyToCurrentPerson({
      text: `Kamu sudah masuk ke sesi game: ${
        chat.isGroupChat ? "[REDACTED]" : chat.user!.gameProperty?.gameID
      }`,
    });
  }
}
