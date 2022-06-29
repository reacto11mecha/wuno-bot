import { Types } from "mongoose";
import { DocumentType, isDocument } from "@typegoose/typegoose";
import { requiredJoinGameSession } from "../utils";

import { Card, CardModel } from "../models";

export default requiredJoinGameSession(async ({ chat, game }) => {
  if (game.NotFound) {
    return await chat.replyToCurrentPerson({
      text: "Sebuah kesalahan, game tidak ditemukan!",
    });
  } else if (game.isGameCreator) {
    if (game.players?.length === 1) {
      return await chat.replyToCurrentPerson({
        text: "Minimal ada dua pemain yang tergabung!",
      });
    } else if (game.state.PLAYING) {
      return await chat.replyToCurrentPerson({
        text: "Game ini sedang dimainkan!",
      });
    }

    const usersCard = await Promise.all(
      game.players!.map(async (player) => {
        if (isDocument(player)) {
          const card = await CardModel.create({
            user: player._id,
            game: game.uid,
          });
          player.gameProperty!.card = card._id;

          await player.save();
          return card;
        }
      })
    );

    await game.startGame();

    const currentPlayerCard = <DocumentType<Card>>(
      usersCard.find(
        (card) =>
          isDocument(card) &&
          game.currentPositionId!.equals(card.user as Types.ObjectId)
      )
    );

    await Promise.all([
      (async () => {
        if (isDocument(game.currentPlayer)) {
          await chat.replyToCurrentPerson({
            text: `Game berhasil dimulai! Sekarang giliran ${
              game.currentPlayerIsAuthor ? "kamu" : game.currentPlayer.userName
            } untuk bermain`,
          });
        }

        if (game.currentPlayerIsAuthor) {
          await chat.sendToCurrentPerson({
            text: `Kartu saat ini: ${game.currentCard}`,
          });

          await chat.sendToCurrentPerson({
            text: `Kartu kamu: ${currentPlayerCard!.cards?.join(", ")}.`,
          });
        }
      })(),
      (async () => {
        if (
          !game.currentPlayerIsAuthor &&
          isDocument(game.currentPlayer) &&
          isDocument(currentPlayerCard)
        ) {
          const toPerson = game.currentPlayer!.phoneNumber;

          await chat.sendToOtherPerson(toPerson, {
            text: `${chat.message.userName} telah memulai permainan! Sekarang giliran kamu untuk bermain`,
          });
          await chat.sendToOtherPerson(toPerson, {
            text: `Kartu saat ini: ${game.currentCard}`,
          });
          await chat.sendToOtherPerson(toPerson, {
            text: `Kartu kamu: ${currentPlayerCard!.cards?.join(", ")}.`,
          });
        }
      })(),
      (async () => {
        if (isDocument(game.currentPlayer)) {
          await game.sendToOtherPlayersWithoutCurrentPlayer({
            text: `${chat.message.userName} telah memulai permainan! Sekarang giliran ${game.currentPlayer.userName} untuk bermain`,
          });
        }
      })(),
    ]);

    chat.logger.info(`[DB] Game ${game.gameID} dimulai`);
  } else {
    await chat.replyToCurrentPerson({
      text: "Kamu bukanlah orang yang membuat sesi permainannya!",
    });
  }
});
