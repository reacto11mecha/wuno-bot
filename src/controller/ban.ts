import { prisma } from "../handler/database";
import { createAllCardImage, requiredJoinGameSession } from "../utils";
import { env } from "../env";

import type { allCard } from "../config/cards";

// Basically kick controller with extra add user to the banned list
export default requiredJoinGameSession(async ({ chat, game }) => {
  if (!game.isGameCreator)
    return await chat.replyToCurrentPerson("Kamu bukan pembuat gamenya!");

  const message = chat.args.join(" ").trim();
  const players = await game.getAllPlayerUserObject();

  const player = players.find((player) => player?.username === message);

  if (message === "")
    return await chat.replyToCurrentPerson("Sebutkan siapa yang ingin di ban!");

  if (player) {
    const playerList = game.players
      .filter((gamePlayer) => gamePlayer.playerId !== player.id)
      .filter((player) => player.playerId !== chat.user!.id);

    const afterPlayerGetKicked = game.players.filter(
      (player) => player.playerId !== player.id
    );

    if (player.id === chat.user!.id)
      return await chat.replyToCurrentPerson(
        "Kamu tidak bisa ban dirimu sendiri. Jika ingin keluar dari game, gunakan perintah *leavegame*!"
      );

    switch (true) {
      case game.state.PLAYING: {
        if (afterPlayerGetKicked.length < 2) {
          chat.replyToCurrentPerson(
            `Kamu tidak bisa ban pemain jika hanya ada dua orang. Kamu bisa menghentikan permainan atau keluar permainan dengan \`\`\`${env.PREFIX}eg\`\`\` atau \`\`\`${env.PREFIX}lg\`\`\`.`
          );

          return;
        }

        // Current game turn is the same player as the player that want to kick
        if (game.currentPositionId === player.id) {
          const nextPlayerId = game.getNextPosition();

          const [nextPlayer, nextPlayerCards] = await Promise.all([
            prisma.user.findUnique({
              where: { id: nextPlayerId!.playerId },
            }),
            prisma.userCard.findUnique({
              where: {
                playerId: nextPlayerId!.playerId,
              },
              include: {
                cards: true,
              },
            }),
          ]);

          const [currentCardImage, frontCardsImage, backCardsImage] =
            await createAllCardImage(
              game.currentCard as allCard,
              nextPlayerCards?.cards.map((card) => card.cardName) as allCard[]
            );

          const actualPlayerList = playerList.filter(
            (player) => player.playerId !== nextPlayerId!.playerId
          );

          await game.updatePosition(nextPlayer!.id);
          await game.removeUserFromArray(player.id);
          await game.addUserToBannedList(player.id);

          await Promise.all([
            // Send message to the kicked player
            chat.sendToOtherPerson(
              player.phoneNumber,
              "Anda sudah di banned dari permainan, sekarang kamu tidak lagi bermain."
            ),

            // Send message to game creator
            (async () => {
              await chat.replyToCurrentPerson(
                `Berhasil untuk ban ${
                  player.username
                } dari permainan, sekarang giliran ${
                  nextPlayer!.username
                } untuk bermain`
              );
              await chat.replyToCurrentPerson(
                { caption: `Kartu saat ini: ${game.currentCard}` },
                currentCardImage
              );
              await chat.replyToCurrentPerson(
                { caption: `Kartu yang ${nextPlayer!.username} miliki` },
                backCardsImage
              );
            })(),

            // Send message to next player
            (async () => {
              await chat.sendToOtherPerson(
                nextPlayer!.phoneNumber,
                `${player.username} telah di banned oleh ${chat.message.userName}. Sekarang giliran kamu untuk bermain`
              );
              await chat.sendToOtherPerson(
                nextPlayer!.phoneNumber,
                { caption: `Kartu saat ini: ${game.currentCard}` },
                currentCardImage
              );
              await chat.sendToOtherPerson(
                nextPlayer!.phoneNumber,
                {
                  caption: `Kartu kamu: ${nextPlayerCards?.cards
                    .map((card) => card.cardName)
                    .join(", ")}.`,
                },
                frontCardsImage
              );
            })(),

            // Rest of the players
            (async () => {
              await game.sendToSpecificPlayerList(
                `${player.username} sudah di banned dari permainan oleh ${
                  chat.message.userName
                }. Sekarang giliran ${nextPlayer!.username} untuk bermain`,
                actualPlayerList
              );
              await game.sendToSpecificPlayerList(
                { caption: `Kartu saat ini: ${game.currentCard}` },
                actualPlayerList,
                currentCardImage
              );
              await game.sendToSpecificPlayerList(
                { caption: `Kartu yang ${nextPlayer!.username} miliki` },
                actualPlayerList,
                backCardsImage
              );
            })(),
          ]);

          return;
        }

        break;
      }

      case game.state.PLAYING && game.currentPositionId !== player!.id:
      case game.state.WAITING:
      default: {
        await game.removeUserFromArray(player.id);
        await game.addUserToBannedList(player.id);

        await Promise.all([
          // Send message to the kicked player
          chat.sendToOtherPerson(
            player.phoneNumber,
            "Anda sudah di banned dari permainan, sekarang kamu tidak lagi bermain."
          ),

          // Send message to game creator
          await chat.replyToCurrentPerson(
            `Berhasil ban ${player.id} dari permainan.`
          ),

          // Rest of the players
          game.sendToSpecificPlayerList(
            `${player.username} sudah di banned permainan oleh ${chat.message.userName}, sekarang dia tidak ada lagi dalam permainan.`,
            playerList
          ),
        ]);

        break;
      }
    }
  } else {
    await chat.replyToCurrentPerson(
      `Tidak ada pemain yang bernama "${message}"`
    );
  }
});
