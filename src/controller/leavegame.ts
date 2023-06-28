import { requiredJoinGameSession, createAllCardImage } from "../utils";

import { Game, Chat } from "../lib";
import { prisma } from "../handler/database";

import type { allCard } from "../config/cards";

async function removeGameAuthorAndSetToNextPlayer(chat: Chat, game: Game) {
  if (game.players.length > 0) {
    const { playerId } = game.players[0];

    const players = await game.getAllPlayerUserObject();

    const player = players.find((player) => player?.id === playerId);

    await game.setCreatorId(playerId);

    if (player) {
      await Promise.all([
        chat.replyToCurrentPerson(
          `Anda berhasil keluar dari game. Pembuat game sudah berpindah posisi ke ${player.username}`
        ),
        game.sendToOtherPlayersWithoutCurrentPlayer(
          `${chat.message.userName} telah keluar dari game, dan posisi host sekarang berpindah ke ${player.username}`
        ),
      ]);
    }
  }
}

export default requiredJoinGameSession(async ({ chat, game }) => {
  const creator = await game.getCreatorUser();

  const nextPlayerMetadata = game.getNextPosition();

  await game.removeUserFromArray(chat.user!.id);

  const nextPlayer = nextPlayerMetadata
    ? await prisma.user.findUnique({
        where: { id: nextPlayerMetadata.playerId },
      })
    : null;

  if (game.state.PLAYING) {
    const currentPlayer = await prisma.user.findUnique({
      where: {
        id: game.currentPositionId!,
      },
    });

    // Check if players is less than two person
    if (game.players!.length < 2) {
      await game.endGame();

      await Promise.all([
        chat.replyToCurrentPerson(
          "Anda berhasil keluar dari permainan, tetapi karena pemain kurang dari dua orang maka game otomatis dihentikan. Terimakasih sudah bermain!"
        ),
        game.sendToOtherPlayersWithoutCurrentPlayer(
          `Pemain ${chat.message.userName} sudah keluar dari permainan, tetapi karena pemain kurang dari dua orang maka game otomatis dihentikan. Terimakasih sudah bermain!`
        ),
      ]);

      return;
    }

    // Typeguard playing state start
    if (currentPlayer && nextPlayer) {
      if (game.currentPlayerIsAuthor) {
        // Is current chatter the author and it's turn
        await game.setCreatorId(nextPlayer.id);

        await game.updatePosition(nextPlayer.id);

        const userCard = await prisma.userCard.findUnique({
          where: {
            playerId: nextPlayer.id,
          },
          include: {
            cards: true,
          },
        });

        const [currentCardImage, frontCardsImage, backCardsImage] =
          await createAllCardImage(
            game.currentCard as allCard,
            userCard?.cards.map((card) => card.cardName) as allCard[]
          );

        await Promise.all([
          (async () => {
            await chat.sendToOtherPerson(
              nextPlayer.phoneNumber,
              "Kamu sekarang adalah host dari game ini, kamu juga yang saat ini dapat giliran main"
            );
            await chat.sendToOtherPerson(
              nextPlayer.phoneNumber,
              `Kartu saat ini: ${game.currentCard}`,
              currentCardImage
            );
            await chat.sendToOtherPerson(
              nextPlayer.phoneNumber,
              `Kartu kamu: ${userCard?.cards
                .map((card) => card.cardName)
                .join(", ")}.`,
              frontCardsImage
            );
          })(),
          chat.replyToCurrentPerson(
            `Anda berhasil keluar dari game. Pembuat game dan giliran main sudah berpindah posisi ke ${nextPlayer.username}`
          ),
          (async () => {
            await game.sendToOtherPlayersWithoutCurrentPlayer(
              `${chat.message.userName} telah keluar dari game, dan posisi host sekarang berpindah ke ${nextPlayer.username}, saat ini giliran dia juga untuk bermain`
            );
            await game.sendToOtherPlayersWithoutCurrentPlayer(
              `Kartu saat ini: ${game.currentCard}`,
              currentCardImage
            );
            await game.sendToOtherPlayersWithoutCurrentPlayer(
              `Kartu yang ${nextPlayer.username} miliki`,
              backCardsImage
            );
          })(),
        ]);
      } else if (game.isGameCreator) {
        // Is current chatter the author and not it's turn
        await removeGameAuthorAndSetToNextPlayer(chat, game);
      } else if (game.isCurrentChatTurn) {
        // Is current chatter not the author and it's turn
        await game.updatePosition(nextPlayer.id);

        const userCard = await prisma.userCard.findUnique({
          where: {
            playerId: nextPlayer.id,
          },
          include: {
            cards: true,
          },
        });

        await Promise.all([
          (async () => {
            await chat.sendToOtherPerson(
              nextPlayer.phoneNumber,
              `${chat.message.userName} telah keluar dari game, selanjutnya adalah giliran kamu untuk bermain`
            );
            await chat.sendToOtherPerson(
              nextPlayer.phoneNumber,
              `Kartu saat ini: ${game.currentCard}`
            );
            await chat.sendToOtherPerson(
              nextPlayer.phoneNumber,
              `Kartu kamu: ${userCard?.cards
                .map((card) => card.cardName)
                .join(", ")}.`
            );
          })(),
          chat.replyToCurrentPerson(
            `Anda berhasil keluar dari game. Pembuat game sudah berpindah posisi ke ${nextPlayer.username}`
          ),
          game.sendToOtherPlayersWithoutCurrentPlayer(
            `${chat.message.userName} telah keluar dari game, selanjutnya adalah giliran ${nextPlayer.username} untuk bermain`
          ),
        ]);
      } else {
        // Is current chatter not the author and not it's turn
        await Promise.all([
          chat.replyToCurrentPerson(
            "Anda berhasil keluar dari game. Terimakasih telah bermain!"
          ),
          game.sendToOtherPlayersWithoutCurrentPlayer(
            `${chat.message.userName} telah keluar dari game`
          ),
        ]);
      }
    }
    // Typeguard playing state end
  } else {
    // WAITING STATE

    // Typeguard waiting state start
    if (creator) {
      if (creator.id === chat.user!.id && game.players!.length > 1) {
        // Is current chatter is author and it's more than one player waiting
        await removeGameAuthorAndSetToNextPlayer(chat, game);
      } else if (creator.id === chat.user!.id && game.players!.length < 2) {
        // Is current chatter is author and less than two players waiting
        await game.endGame();

        await chat.replyToCurrentPerson(
          "Anda berhasil keluar dari game, tetapi karena hanya anda saja yang berada otomatis game dihentikan. Terimakasih sudah bermain!"
        );
      } else {
        // Is current chatter is not the author
        await Promise.all([
          chat.replyToCurrentPerson(
            "Anda berhasil keluar dari game. Terimakasih telah bermain!"
          ),
          game.sendToOtherPlayersWithoutCurrentPlayer(
            `${chat.message.userName} telah keluar dari game`
          ),
        ]);
      }
    }
    // Typeguard waiting state stop
  }
});
