import { requiredJoinGameSession, createAllCardImage } from "../utils";

import type { allCard } from "../config/cards";

import { prisma } from "../handler/database";

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

    const [playersUserData, currentPlayerCard, currentPlayer] =
      await Promise.all([
        game.getAllPlayerUserObject(),
        prisma.userCard.findUnique({
          where: {
            playerId: game.currentPositionId!,
          },
          include: {
            cards: true,
          },
        }),
        game.getCurrentPlayerUserData(),
      ]);

    const playersOrder = game.playersOrderIds
      .map((playerId) =>
        playersUserData.find((player) => player?.id === playerId)
      )
      .map((player, idx) => `${idx + 1}. ${player?.username}`)
      .join("\n");

    const playerList = game.players
      .filter((player) => player.playerId !== chat.user!.id)
      .filter((player) => player.playerId !== game.currentPositionId!);

    const [currentCardImage, frontCardsImage, backCardsImage] =
      await createAllCardImage(
        game.currentCard as allCard,
        currentPlayerCard?.cards.map((card) => card.cardName) as allCard[]
      );

    if (game.currentPlayerIsAuthor) {
      await Promise.all([
        // Admin as current player Side
        (async () => {
          if (currentPlayer) {
            await chat.replyToCurrentPerson(
              "Game berhasil dimulai! Sekarang giliran kamu untuk bermain"
            );
            await chat.replyToCurrentPerson(`Urutan Bermain:\n${playersOrder}`);

            await chat.sendToCurrentPerson(
              { caption: `Kartu saat ini: ${game.currentCard}` },
              currentCardImage
            );
            await chat.sendToCurrentPerson(
              {
                caption: `Kartu kamu: ${currentPlayerCard?.cards
                  .map((card) => card.cardName)
                  .join(", ")}.`,
              },
              frontCardsImage
            );
          }
        })(),

        // Other player side
        (async () => {
          if (currentPlayer) {
            await game.sendToSpecificPlayerList(
              `${
                chat.message.userName
              } telah memulai permainan! Sekarang giliran ${
                game.currentPlayerIsAuthor ? "dia" : currentPlayer.username
              } untuk bermain`,
              playerList
            );
            await game.sendToSpecificPlayerList(
              `Urutan Bermain:\n${playersOrder}`,
              playerList
            );

            await game.sendToSpecificPlayerList(
              { caption: `Kartu saat ini: ${game.currentCard}` },
              playerList,
              currentCardImage
            );
            await game.sendToSpecificPlayerList(
              { caption: `Kartu yang ${currentPlayer.username} miliki` },
              playerList,
              backCardsImage
            );
          }
        })(),
      ]);

      return;
    }

    await Promise.all([
      // Admin side but it isn't their turn
      (async () => {
        if (currentPlayer) {
          await chat.replyToCurrentPerson(
            `Game berhasil dimulai! Sekarang giliran ${currentPlayer.username} untuk bermain`
          );
          await chat.replyToCurrentPerson(`Urutan Bermain:\n${playersOrder}`);

          await chat.sendToCurrentPerson(
            { caption: `Kartu saat ini: ${game.currentCard}` },
            currentCardImage
          );
          await chat.sendToCurrentPerson(
            {
              caption: `Kartu yang ${currentPlayer.username} miliki`,
            },
            backCardsImage
          );
        }
      })(),

      // The person who got the first turn
      (async () => {
        if (currentPlayer) {
          const currentPlayerNumber = currentPlayer.phoneNumber;

          await chat.sendToOtherPerson(
            currentPlayerNumber,
            "Game berhasil dimulai! Sekarang giliran kamu untuk bermain"
          );
          await chat.sendToOtherPerson(
            currentPlayerNumber,
            `Urutan Bermain:\n${playersOrder}`
          );

          await chat.sendToOtherPerson(
            currentPlayerNumber,
            { caption: `Kartu saat ini: ${game.currentCard}` },
            currentCardImage
          );
          await chat.sendToOtherPerson(
            currentPlayerNumber,
            {
              caption: `Kartu kamu: ${currentPlayerCard?.cards
                .map((card) => card.cardName)
                .join(", ")}.`,
            },
            frontCardsImage
          );
        }
      })(),

      // The rest of the game player
      (async () => {
        if (currentPlayer) {
          await game.sendToSpecificPlayerList(
            `${chat.message.userName} telah memulai permainan! Sekarang giliran ${currentPlayer.username} untuk bermain`,
            playerList
          );
          await game.sendToSpecificPlayerList(
            `Urutan Bermain:\n${playersOrder}`,
            playerList
          );

          await game.sendToSpecificPlayerList(
            { caption: `Kartu saat ini: ${game.currentCard}` },
            playerList,
            currentCardImage
          );
          await game.sendToSpecificPlayerList(
            { caption: `Kartu yang ${currentPlayer.username} miliki` },
            playerList,
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
