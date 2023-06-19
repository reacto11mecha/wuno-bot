import { requiredJoinGameSession, createAllCardImage } from "../utils";

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

    await game.startGame();

    // const currentPlayerCard = <DocumentType<Card>>(
    //   usersCard.find(
    //     (card) =>
    //       isDocument(card) &&
    //       game.currentPositionId!.equals(card.user as Types.ObjectId)
    //   )
    // );

    // const [currentCardImage, frontCardsImage, backCardsImage] =
    //   await createAllCardImage(
    //     game.currentCard as allCard,
    //     currentPlayerCard.cards as allCard[]
    //   );

    // const playersOrder = game
    //   .playersOrderIds!.map(
    //     (player) =>
    //       game.players!.find((user) =>
    //         user._id.equals(player)
    //       ) as DocumentType<User>
    //   )
    //   .map((player, idx) => `${idx + 1}. ${player.userName}`)
    //   .join("\n");

    // switch (true) {
    //   case game.currentPlayerIsAuthor: {
    //     await Promise.all([
    //       // Admin as current player Side
    //       (async () => {
    //         if (isDocument(game.currentPlayer)) {
    //           await chat.replyToCurrentPerson(
    //             "Game berhasil dimulai! Sekarang giliran kamu untuk bermain"
    //           );
    //           await chat.replyToCurrentPerson(
    //             `Urutan Bermain:\n${playersOrder}`
    //           );

    //           await chat.sendToCurrentPerson(
    //             { caption: `Kartu saat ini: ${game.currentCard}` },
    //             currentCardImage
    //           );
    //           await chat.sendToCurrentPerson(
    //             {
    //               caption: `Kartu kamu: ${currentPlayerCard.cards?.join(
    //                 ", "
    //               )}.`,
    //             },
    //             frontCardsImage
    //           );
    //         }
    //       })(),

    //       // Other player side
    //       (async () => {
    //         if (
    //           isDocumentArray(game.players) &&
    //           isDocument(game.currentPlayer)
    //         ) {
    //           const PlayerList = game.players
    //             .filter(
    //               (player) =>
    //                 isDocument(player) &&
    //                 isDocument(game.currentPlayer) &&
    //                 player.phoneNumber !== game.currentPlayer.phoneNumber
    //             )
    //             .filter(
    //               (player) =>
    //                 isDocument(player) &&
    //                 player.phoneNumber !== chat.message.userNumber
    //             );

    //           await game.sendToOtherPlayersWithoutCurrentPerson(
    //             `${
    //               chat.message.userName
    //             } telah memulai permainan! Sekarang giliran ${
    //               game.currentPlayerIsAuthor
    //                 ? "dia"
    //                 : game.currentPlayer.userName
    //             } untuk bermain`,
    //             PlayerList
    //           );
    //           await game.sendToOtherPlayersWithoutCurrentPerson(
    //             `Urutan Bermain:\n${playersOrder}`,
    //             PlayerList
    //           );

    //           await game.sendToOtherPlayersWithoutCurrentPerson(
    //             { caption: `Kartu saat ini: ${game.currentCard}` },
    //             PlayerList,
    //             currentCardImage
    //           );
    //           await game.sendToOtherPlayersWithoutCurrentPerson(
    //             { caption: `Kartu yang ${game.currentPlayer.userName} miliki` },
    //             PlayerList,
    //             backCardsImage
    //           );
    //         }
    //       })(),
    //     ]);
    //     break;
    //   }

    //   // It isn't admin turn
    //   default: {
    //     await Promise.all([
    //       // Admin side but it isn't their turn
    //       (async () => {
    //         if (isDocument(game.currentPlayer)) {
    //           await chat.replyToCurrentPerson(
    //             `Game berhasil dimulai! Sekarang giliran ${game.currentPlayer.userName} untuk bermain`
    //           );
    //           await chat.replyToCurrentPerson(
    //             `Urutan Bermain:\n${playersOrder}`
    //           );

    //           await chat.sendToCurrentPerson(
    //             { caption: `Kartu saat ini: ${game.currentCard}` },
    //             currentCardImage
    //           );
    //           await chat.sendToCurrentPerson(
    //             {
    //               caption: `Kartu yang ${game.currentPlayer.userName} miliki`,
    //             },
    //             backCardsImage
    //           );
    //         }
    //       })(),

    //       // The person who got the first turn
    //       (async () => {
    //         if (isDocument(game.currentPlayer)) {
    //           const currentPlayerNumber = game.currentPlayer.phoneNumber;

    //           await chat.sendToOtherPerson(
    //             currentPlayerNumber,
    //             "Game berhasil dimulai! Sekarang giliran kamu untuk bermain"
    //           );
    //           await chat.sendToOtherPerson(
    //             currentPlayerNumber,
    //             `Urutan Bermain:\n${playersOrder}`
    //           );

    //           await chat.sendToOtherPerson(
    //             currentPlayerNumber,
    //             { caption: `Kartu saat ini: ${game.currentCard}` },
    //             currentCardImage
    //           );
    //           await chat.sendToOtherPerson(
    //             currentPlayerNumber,
    //             {
    //               caption: `Kartu kamu: ${currentPlayerCard.cards?.join(
    //                 ", "
    //               )}.`,
    //             },
    //             frontCardsImage
    //           );
    //         }
    //       })(),

    //       // The rest of the game player
    //       (async () => {
    //         if (
    //           isDocumentArray(game.players) &&
    //           isDocument(game.currentPlayer)
    //         ) {
    //           const PlayerList = game.players
    //             .filter(
    //               (player) =>
    //                 isDocument(player) &&
    //                 isDocument(game.currentPlayer) &&
    //                 player.phoneNumber !== game.currentPlayer.phoneNumber
    //             )
    //             .filter(
    //               (player) =>
    //                 isDocument(player) &&
    //                 player.phoneNumber !== chat.message.userNumber
    //             );

    //           await game.sendToOtherPlayersWithoutCurrentPerson(
    //             `${chat.message.userName} telah memulai permainan! Sekarang giliran ${game.currentPlayer.userName} untuk bermain`,
    //             PlayerList
    //           );
    //           await game.sendToOtherPlayersWithoutCurrentPerson(
    //             `Urutan Bermain:\n${playersOrder}`,
    //             PlayerList
    //           );

    //           await game.sendToOtherPlayersWithoutCurrentPerson(
    //             { caption: `Kartu saat ini: ${game.currentCard}` },
    //             PlayerList,
    //             currentCardImage
    //           );
    //           await game.sendToOtherPlayersWithoutCurrentPerson(
    //             { caption: `Kartu yang ${game.currentPlayer.userName} miliki` },
    //             PlayerList,
    //             backCardsImage
    //           );
    //         }
    //       })(),
    //     ]);

    //     break;
    //   }
    // }

    chat.logger.info(`[DB] Game ${game.gameID} dimulai`);
  } else {
    await chat.replyToCurrentPerson(
      "Kamu bukanlah orang yang membuat sesi permainannya!"
    );
  }
});
