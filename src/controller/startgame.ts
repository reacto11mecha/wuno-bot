import { Types } from "mongoose";
import {
  DocumentType,
  isDocument,
  isDocumentArray,
} from "@typegoose/typegoose";
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
        if (isDocument(game.currentPlayer) && isDocument(currentPlayerCard)) {
          await chat.replyToCurrentPerson(
            `Game berhasil dimulai! Sekarang giliran ${
              game.currentPlayerIsAuthor ? "kamu" : game.currentPlayer.userName
            } untuk bermain`
          );

          if (!game.currentPlayerIsAuthor) {
            await Promise.all([
              chat.sendToOtherPerson(
                game.currentPlayer.phoneNumber,
                `${chat.message.userName} telah memulai permainan! Sekarang giliran kamu untuk bermain`
              ),
              (async () => {
                if (isDocument(game.currentPlayer)) {
                  await chat.sendToCurrentPerson(
                    { caption: `Kartu saat ini: ${game.currentCard}` },
                    currentCardImage
                  );
                  await chat.sendToCurrentPerson(
                    {
                      caption: `Kartu yang ${game.currentPlayer.userName} miliki`,
                    },
                    backCardsImage
                  );
                }
              })(),
            ]);
          }

          const currentPlayerNumber = game.currentPlayer.phoneNumber;

          await chat.sendToOtherPerson(
            currentPlayerNumber,
            { caption: `Kartu saat ini: ${game.currentCard}` },
            currentCardImage
          );
          await chat.sendToOtherPerson(
            currentPlayerNumber,
            { caption: `Kartu kamu: ${currentPlayerCard.cards?.join(", ")}.` },
            frontCardsImage
          );
        }
      })(),

      (async () => {
        if (isDocumentArray(game.players) && isDocument(game.currentPlayer)) {
          const PlayerList = game.players
            .filter(
              (player) =>
                isDocument(player) &&
                isDocument(game.currentPlayer) &&
                player.phoneNumber !== game.currentPlayer.phoneNumber
            )
            .filter(
              (player) =>
                isDocument(player) &&
                player.phoneNumber !== chat.message.userNumber
            );

          await game.sendToOtherPlayersWithoutCurrentPerson(
            `${
              chat.message.userName
            } telah memulai permainan! Sekarang giliran ${
              game.currentPlayerIsAuthor ? "dia" : game.currentPlayer.userName
            } untuk bermain`,
            PlayerList
          );

          await game.sendToOtherPlayersWithoutCurrentPerson(
            { caption: `Kartu saat ini: ${game.currentCard}` },
            PlayerList,
            currentCardImage
          );
          await game.sendToOtherPlayersWithoutCurrentPerson(
            { caption: `Kartu yang ${game.currentPlayer.userName} miliki` },
            PlayerList,
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
