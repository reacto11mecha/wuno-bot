import { requiredJoinGameSession, createAllCardImage } from "../utils";

import type { allCard } from "../config/cards";

import { prisma } from "../lib/database";

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

    const {
      currentPositionId,
      currentCard,
      currentPlayerIsAuthor,
      playersOrder,
    } = await game.startGame();

    const currentPlayerCard = await prisma.userCard.findUnique({
      where: {
        playerId: currentPositionId,
      },
      include: {
        cards: true,
      },
    });

    const [currentCardImage, frontCardsImage, backCardsImage] =
      await createAllCardImage(
        currentCard,
        currentPlayerCard?.cards.map((card) => card.cardName) as allCard[]
      );

    const currentPlayer = await game.getCurrentPlayerUserData();

    switch (true) {
      case currentPlayerIsAuthor: {
        await Promise.all([
          // Admin as current player Side
          (async () => {
            if (currentPlayer) {
              await chat.replyToCurrentPerson(
                "Game berhasil dimulai! Sekarang giliran kamu untuk bermain"
              );
              await chat.replyToCurrentPerson(
                `Urutan Bermain:\n${playersOrder}`
              );

              await chat.sendToCurrentPerson(
                { caption: `Kartu saat ini: ${currentCard}` },
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
              const PlayerList = game.players.filter(
                (player) => player.playerId !== currentPlayer.id
              );

              await game.sendToOtherPlayersWithoutCurrentPerson(
                `${
                  chat.message.userName
                } telah memulai permainan! Sekarang giliran ${
                  game.currentPlayerIsAuthor ? "dia" : currentPlayer.username
                } untuk bermain`,
                PlayerList
              );
              await game.sendToOtherPlayersWithoutCurrentPerson(
                `Urutan Bermain:\n${playersOrder}`,
                PlayerList
              );

              await game.sendToOtherPlayersWithoutCurrentPerson(
                { caption: `Kartu saat ini: ${currentCard}` },
                PlayerList,
                currentCardImage
              );
              await game.sendToOtherPlayersWithoutCurrentPerson(
                { caption: `Kartu yang ${currentPlayer.username} miliki` },
                PlayerList,
                backCardsImage
              );
            }
          })(),
        ]);

        break;
      }

      // It isn't admin turn
      default: {
        await Promise.all([
          // Admin side but it isn't their turn
          (async () => {
            if (currentPlayer) {
              await chat.replyToCurrentPerson(
                `Game berhasil dimulai! Sekarang giliran ${currentPlayer.username} untuk bermain`
              );
              await chat.replyToCurrentPerson(
                `Urutan Bermain:\n${playersOrder}`
              );

              await chat.sendToCurrentPerson(
                { caption: `Kartu saat ini: ${currentCard}` },
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
                { caption: `Kartu saat ini: ${currentCard}` },
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
              const PlayerList = game.players
                .filter((player) => player.playerId !== currentPlayer.id)
                .filter((player) => player.playerId === chat.user!.id);

              await game.sendToOtherPlayersWithoutCurrentPerson(
                `${chat.message.userName} telah memulai permainan! Sekarang giliran ${currentPlayer.username} untuk bermain`,
                PlayerList
              );
              await game.sendToOtherPlayersWithoutCurrentPerson(
                `Urutan Bermain:\n${playersOrder}`,
                PlayerList
              );

              await game.sendToOtherPlayersWithoutCurrentPerson(
                { caption: `Kartu saat ini: ${currentCard}` },
                PlayerList,
                currentCardImage
              );
              await game.sendToOtherPlayersWithoutCurrentPerson(
                { caption: `Kartu yang ${currentPlayer.username} miliki` },
                PlayerList,
                backCardsImage
              );
            }
          })(),
        ]);

        break;
      }
    }

    chat.logger.info(`[DB] Game ${game.gameID} dimulai`);
  } else {
    await chat.replyToCurrentPerson(
      "Kamu bukanlah orang yang membuat sesi permainannya!"
    );
  }
});
