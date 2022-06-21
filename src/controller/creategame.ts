import { nanoid } from "nanoid";

import { Chat } from "../lib";
import { Game, GameProperty } from "../entity";

import { cards } from "../config/cards";

import { random } from "../utils";
import { databaseSource } from "../handler/database";

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
    const newGame = new Game();
    newGame.gameID = nanoid(11);
    newGame.gameCreatorID = chat.user!;
    newGame.currentCard = getIntialCard();

    const actualGame = await databaseSource.manager.save(newGame);

    chat.user!.gameProperty = new GameProperty(true, actualGame);
    actualGame.players = [chat.user!];

    console.log(chat.user!);
    await Promise.all([
      databaseSource.manager.save(actualGame),
      databaseSource.manager.save(chat.user!),
    ]);

    chat.logger.info(
      `[DB] Berhasil membuat sesi game baru | ${actualGame.gameID}`
    );

    await chat.replyToCurrentPerson({
      text: `Game berhasil dibuat.\nAjak teman kamu untuk bermain.\n\nPemain yang sudah tergabung\n- ${
        chat.user!.userName
      }\n\nKode: ${actualGame.gameID}`,
    });
    await chat.replyToCurrentPerson({
      text: `${process.env.PREFIX || "U#"}j ${actualGame.gameID}`,
    });
  } else {
    await chat.replyToCurrentPerson({
      text: `Kamu sudah masuk ke sesi game: ${
        chat.isGroupChat ? "[REDACTED]" : chat.user!.gameProperty.gameID
      }`,
    });
  }
}
