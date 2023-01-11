import { Chat } from "../lib";
import { GameModel, Game } from "../models";

import { PREFIX } from "../config/prefix";

export default async function creategame(chat: Chat) {
  if (!chat.isJoiningGame) {
    const newGame = await GameModel.create({
      gameCreatorID: chat.user!._id,
      players: [chat.user!._id],
    } as Game);

    await chat.setUserGameProperty({
      isJoiningGame: true,
      gameUID: newGame._id,
      gameID: newGame.gameID,
    });

    chat.logger.info(
      `[DB] Berhasil membuat sesi game baru | ${newGame.gameID}`
    );

    if (chat.isGroupChat) {
      await chat.replyToCurrentPerson(
        `Game berhasil dibuat.\n\nPemain yang sudah tergabung\n- ${
          chat.user!.userName
        }\n\nKode: ${newGame.gameID}`
      );

      await chat.sendToCurrentPerson(
        "Ayo semua yang berada di grup ini untuk bermain UNO bersama-sama! Teruskan pesan di bawah ke saya dan tunggu permainan untuk dimulai!"
      );

      await chat.sendToCurrentPerson(`${PREFIX}j ${newGame.gameID}`);

      return;
    }

    await chat.replyToCurrentPerson(
      `Game berhasil dibuat.\nAjak teman kamu untuk bermain.\n\nPemain yang sudah tergabung\n- ${
        chat.user!.userName
      }\n\nKode: ${newGame.gameID}`
    );
    await chat.replyToCurrentPerson(`${PREFIX}j ${newGame.gameID}`);
  } else {
    await chat.replyToCurrentPerson(
      `Kamu sudah masuk ke sesi game: ${
        chat.isGroupChat ? "[REDACTED]" : chat.user!.gameProperty?.gameID
      }`
    );
  }
}
