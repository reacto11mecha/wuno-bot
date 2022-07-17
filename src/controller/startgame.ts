import { Types } from "mongoose";
import { DocumentType, isDocument } from "@typegoose/typegoose";
import { requiredJoinGameSession, createAllCardImage } from "../utils";

import { Card, CardModel } from "../models";
import { CardPicker } from "../config/cards";
import type { allCard } from "../config/cards";

export default requiredJoinGameSession(async ({ chat, game }) => {
  if (game.NotFound) {
    return await chat.replyToCurrentPerson(
      "Sebuah kesalahan, game tidak ditemukan!"
    );
  } else if (game.isGameCreator) {
    if (game.players?.length === 1) {
      return await chat.replyToCurrentPerson(
        "Minimal ada dua pemain yang tergabung!"
      );
    } else if (game.state.PLAYING) {
      return await chat.replyToCurrentPerson("Game ini sedang dimainkan!");
    }

    const usersCard = await Promise.all(
      game.players!.map(async (player) => {
        if (isDocument(player)) {
          const card = await CardModel.create({
            user: player._id,
            game: game.uid,
            cards: [...new Array(6)].map(() =>
              CardPicker.pickCardByGivenCard(game.currentCard as allCard)
            ),
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

    const [currentCardImage, frontCardsImage, backCardsImage] =
      await createAllCardImage(
        game.currentCard as allCard,
        currentPlayerCard.cards as allCard[]
      );

    await Promise.all([
      (async () => {
        if (isDocument(game.currentPlayer)) {
          await chat.replyToCurrentPerson(
            `Game berhasil dimulai! Sekarang giliran ${
              game.currentPlayerIsAuthor ? "kamu" : game.currentPlayer.userName
            } untuk bermain`
          );
        }

        if (game.currentPlayerIsAuthor) {
          await chat.sendToCurrentPerson(
            `Kartu saat ini: ${game.currentCard}`,
            currentCardImage
          );

          await chat.sendToCurrentPerson(
            `Kartu kamu: ${currentPlayerCard!.cards?.join(", ")}.`,
            frontCardsImage
          );
        }
      })(),
      (async () => {
        if (
          !game.currentPlayerIsAuthor &&
          isDocument(game.currentPlayer) &&
          isDocument(currentPlayerCard)
        ) {
          const toPerson = game.currentPlayer!.phoneNumber;

          await chat.sendToOtherPerson(
            toPerson,
            `${chat.message.userName} telah memulai permainan! Sekarang giliran kamu untuk bermain`
          );
          await chat.sendToOtherPerson(
            toPerson,
            `Kartu saat ini: ${game.currentCard}`,
            currentCardImage
          );
          await chat.sendToOtherPerson(
            toPerson,
            `Kartu kamu: ${currentPlayerCard!.cards?.join(", ")}.`,
            frontCardsImage
          );
        }
      })(),
      (async () => {
        if (isDocument(game.currentPlayer)) {
          await game.sendToOtherPlayersWithoutCurrentPlayer(
            `${chat.message.userName} telah memulai permainan! Sekarang giliran ${game.currentPlayer.userName} untuk bermain`
          );

          await game.sendToOtherPlayersWithoutCurrentPlayer(
            `Kartu saat ini: ${game.currentCard}`,
            currentCardImage
          );
          await game.sendToOtherPlayersWithoutCurrentPlayer(
            `Kartu yang ${game.currentPlayer.userName} miliki`,
            backCardsImage
          );
        }
      })(),
    ]);

    chat.logger.info(`[DB] Game ${game.gameID} dimulai`);
  } else {
    await chat.replyToCurrentPerson(
      "Kamu bukanlah orang yang membuat sesi permainannya!"
    );
  }
});
