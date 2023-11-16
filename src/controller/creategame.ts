import { Chat } from "../lib";
import { prisma } from "../handler/database";
import { nanoid } from "nanoid";

import { env } from "../env";

export default async function creategame(chat: Chat) {
  if (!chat.isJoiningGame) {
    const newGame = await prisma.$transaction(async (tx) => {
      const userId = chat.user!.id;
      const gameID = nanoid(11);

      const game = await tx.game.create({
        data: {
          gameID,
          gameCreatorId: userId,
          allPlayers: {
            create: {
              playerId: userId,
            },
          },
        },
      });

      await tx.userGameProperty.update({
        where: {
          id: userId,
        },
        data: {
          gameID,
          isJoiningGame: true,
        },
      });

      return game;
    });

    chat.logger.info(
      `[DB] Berhasil membuat sesi game baru | ${newGame.gameID}`,
    );

    if (chat.isGroupChat) {
      await chat.replyToCurrentPerson(
        `Game berhasil dibuat.\n\nPemain yang sudah tergabung\n- ${
          chat.user!.username
        }\n\nKode: ${newGame.gameID}`,
      );

      await chat.sendToCurrentPerson(
        "Ayo semua yang berada di grup ini untuk bermain UNO bersama-sama! Teruskan pesan di bawah ke saya dan tunggu permainan untuk dimulai!",
      );

      await chat.sendToCurrentPerson(`${env.PREFIX}j ${newGame.gameID}`);

      return;
    }

    await chat.replyToCurrentPerson(
      `Game berhasil dibuat.\nAjak teman kamu untuk bermain.\n\nPemain yang sudah tergabung\n- ${
        chat.user!.username
      }\n\nKode: ${newGame.gameID}`,
    );
    await chat.replyToCurrentPerson(`${env.PREFIX}j ${newGame.gameID}`);
  } else {
    await chat.replyToCurrentPerson(
      `Kamu sudah masuk ke sesi game: ${
        chat.isGroupChat ? "[REDACTED]" : chat.gameProperty?.gameID
      }`,
    );
  }
}
