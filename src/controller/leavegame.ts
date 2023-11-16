import { requiredJoinGameSession, createAllCardImage } from "../utils";

import { prisma } from "../handler/database";

import type { allCard } from "../config/cards";

export default requiredJoinGameSession(async ({ chat, game }) => {
  switch (true) {
    case game.state.PLAYING: {
      const creator = await game.getCreatorUser();

      const copiedPlayers = [...game.players];
      const afterPlayerWantToLeave = copiedPlayers.filter(
        (player) => player.playerId !== chat.user!.id,
      );

      if (afterPlayerWantToLeave.length < 2) {
        await game.endGame();

        const sendToOpposite = afterPlayerWantToLeave[0];
        const oppositePlayer = await prisma.user.findUnique({
          where: {
            id: sendToOpposite.playerId,
          },
        });

        await Promise.all([
          chat.replyToCurrentPerson(
            "Anda berhasil keluar dari permainan, tetapi karena pemain kurang dari dua orang maka game otomatis dihentikan. Terimakasih sudah bermain!",
          ),
          chat.sendToOtherPerson(
            oppositePlayer!.phoneNumber,
            `Pemain ${chat.message.userName} sudah keluar dari permainan, tetapi karena pemain kurang dari dua orang maka game otomatis dihentikan. Terimakasih sudah bermain!`,
          ),
        ]);

        return;
      }

      // Typeguard
      if (creator) {
        // Current chatter is the creator and
        // want to leave, but it isn't their turn
        if (creator.id === chat.user!.id && !game.currentPlayerIsAuthor) {
          // Because the creator always at the index 0
          // So pick the next game creator from copiedPlayers with index 1
          const nextAuthorId = copiedPlayers[1];
          const nextAuthor = await prisma.user.findUnique({
            where: { id: nextAuthorId.playerId },
          });

          const playerList = afterPlayerWantToLeave.filter(
            (player) => player.playerId !== nextAuthorId.playerId,
          );

          await game.removeUserFromArray(chat.user!.id);
          await game.setCreatorId(nextAuthor!.id);

          await Promise.all([
            chat.replyToCurrentPerson(
              `Anda berhasil keluar dari permainan, sekarang host jatuh ke tangan ${
                nextAuthor!.username
              } dan permainan masih tetap berjalan. Terima kasih sudah bermain!`,
            ),
            chat.sendToOtherPerson(
              nextAuthor!.phoneNumber,
              `${chat.message.userName} sudah keluar dari permainan, saat ini anda adalah hostnya. Lanjutkan permainannya!`,
            ),
            game.sendToSpecificPlayerList(
              `${
                chat.message.userName
              } sudah keluar dari permainan, sekarang host jatuh ke tangan ${
                nextAuthor!.username
              }. Lanjutkan permainannya!`,
              playerList,
            ),
          ]);

          // Current chatter is the creator and
          // want to leave, but it's their turn
        } else if (creator.id === chat.user!.id && game.currentPlayerIsAuthor) {
          const nextAuthorId = copiedPlayers[1];
          const nextPlayerTurnId = game.getNextPosition();

          const playerList = afterPlayerWantToLeave
            .filter((player) => player.playerId !== nextAuthorId.playerId)
            .filter((player) => player.playerId !== nextPlayerTurnId!.playerId);

          const [nextAuthor, nextPlayer, nextPlayerCards] = await Promise.all([
            prisma.user.findUnique({
              where: { id: nextAuthorId.playerId },
            }),
            prisma.user.findUnique({
              where: { id: nextPlayerTurnId!.playerId },
            }),
            prisma.userCard.findUnique({
              where: {
                playerId: nextPlayerTurnId!.playerId,
              },
              include: {
                cards: true,
              },
            }),
          ]);

          const [currentCardImage, frontCardsImage, backCardsImage] =
            await createAllCardImage(
              game.currentCard as allCard,
              nextPlayerCards?.cards.map((card) => card.cardName) as allCard[],
            );

          await game.setCreatorId(nextAuthor!.id);
          await game.updatePosition(nextPlayer!.id);
          await game.removeUserFromArray(creator.id);

          await Promise.all([
            chat.replyToCurrentPerson(
              `Anda berhasil keluar dari permainan, sekarang host jatuh ke tangan ${
                nextAuthor!.username
              } dan giliran main ke ${
                nextPlayer!.username
              }. Terima kasih sudah bermain!`,
            ),
            (async () => {
              // If the next author is also the next player
              if (nextAuthor!.id === nextPlayer!.id) {
                await chat.sendToOtherPerson(
                  nextPlayer!.phoneNumber,
                  `${chat.message.userName} sudah keluar dari permainan. Sekarang posisi bermain dan host jatuh ke tangan anda.`,
                );
                await chat.sendToOtherPerson(
                  nextPlayer!.phoneNumber,
                  { caption: `Kartu saat ini: ${game.currentCard}` },
                  currentCardImage,
                );
                await chat.sendToOtherPerson(
                  nextPlayer!.phoneNumber,
                  {
                    caption: `Kartu kamu: ${nextPlayerCards?.cards
                      .map((card) => card.cardName)
                      .join(", ")}.`,
                  },
                  frontCardsImage,
                );
              } else {
                await Promise.all([
                  // Send message to next author
                  (async () => {
                    await chat.sendToOtherPerson(
                      nextAuthor!.phoneNumber,
                      `${
                        chat.message.userName
                      } sudah keluar dari permainan. Saat ini host permainan ada di tangan anda. Waktunya giliran ${
                        nextPlayer!.username
                      } untuk bermain`,
                    );
                    await chat.sendToOtherPerson(
                      nextAuthor!.phoneNumber,
                      { caption: `Kartu saat ini: ${game.currentCard}` },
                      currentCardImage,
                    );
                    await chat.sendToOtherPerson(
                      nextAuthor!.phoneNumber,
                      { caption: `Kartu yang ${nextPlayer!.username} miliki` },
                      backCardsImage,
                    );
                  })(),

                  // Send message to next player
                  (async () => {
                    await chat.sendToOtherPerson(
                      nextPlayer!.phoneNumber,
                      `${
                        chat.message.userName
                      } sudah keluar dari permainan. Sekarang posisi bermain dan host jatuh ke tangan ${
                        nextAuthor!.username
                      }. Sekarang adalah giliranmu untuk bermain`,
                    );
                    await chat.sendToOtherPerson(
                      nextPlayer!.phoneNumber,
                      { caption: `Kartu saat ini: ${game.currentCard}` },
                      currentCardImage,
                    );
                    await chat.sendToOtherPerson(
                      nextPlayer!.phoneNumber,
                      {
                        caption: `Kartu kamu: ${nextPlayerCards?.cards
                          .map((card) => card.cardName)
                          .join(", ")}.`,
                      },
                      frontCardsImage,
                    );
                  })(),
                ]);
              }
            })(),

            // Rest of the players
            (async () => {
              const initialText =
                nextAuthor!.id === nextPlayer!.id
                  ? `${
                      chat.message.userName
                    } sudah meninggalkan permainan. Giliran host dan bermain jatuh ke tangan *${
                      nextPlayer!.username
                    }*.`
                  : `${
                      chat.message.userName
                    } sudah meninggalkan permainan. Host permainan jatuh ke tangan *${
                      nextAuthor!.username
                    }*. Giliran *${nextPlayer!.username}* untuk bermain.`;

              await game.sendToSpecificPlayerList(initialText, playerList);
              await game.sendToSpecificPlayerList(
                { caption: `Kartu saat ini: ${game.currentCard}` },
                playerList,
                currentCardImage,
              );
              await game.sendToSpecificPlayerList(
                { caption: `Kartu yang ${nextPlayer!.username} miliki` },
                playerList,
                backCardsImage,
              );
            })(),
          ]);

          // Current player isn't the author
        } else if (!game.isGameCreator) {
          // It is current chat turn
          if (game.isCurrentChatTurn) {
            const nextPlayerTurnId = game.getNextPosition();

            const playerList = afterPlayerWantToLeave.filter(
              (player) => player.playerId !== nextPlayerTurnId!.playerId,
            );

            const [nextPlayer, nextPlayerCards] = await Promise.all([
              prisma.user.findUnique({
                where: { id: nextPlayerTurnId!.playerId },
              }),
              prisma.userCard.findUnique({
                where: {
                  playerId: nextPlayerTurnId!.playerId,
                },
                include: {
                  cards: true,
                },
              }),
            ]);

            const [currentCardImage, frontCardsImage, backCardsImage] =
              await createAllCardImage(
                game.currentCard as allCard,
                nextPlayerCards?.cards.map(
                  (card) => card.cardName,
                ) as allCard[],
              );

            await Promise.all([
              chat.replyToCurrentPerson(
                `Anda berhasil keluar dari permainan. Sekarang giliran ${
                  nextPlayer!.username
                } untuk bermain. Terimakasih sudah bermain!`,
              ),

              // Send message to next player
              (async () => {
                await chat.sendToOtherPerson(
                  nextPlayer!.phoneNumber,
                  `${chat.message.userName} telah keluar dari game, selanjutnya adalah giliran kamu untuk bermain`,
                );
                await chat.sendToOtherPerson(
                  nextPlayer!.phoneNumber,
                  { caption: `Kartu saat ini: ${game.currentCard}` },
                  currentCardImage,
                );
                await chat.sendToOtherPerson(
                  nextPlayer!.phoneNumber,
                  {
                    caption: `Kartu kamu: ${nextPlayerCards?.cards
                      .map((card) => card.cardName)
                      .join(", ")}.`,
                  },
                  frontCardsImage,
                );
              })(),

              // Send to the rest player
              (async () => {
                await game.sendToSpecificPlayerList(
                  `${
                    chat.message.userName
                  } sudah keluar dari permainan. Sekarang giliran ${
                    nextPlayer!.username
                  } untuk bermain`,
                  playerList,
                );
                await game.sendToSpecificPlayerList(
                  { caption: `Kartu saat ini: ${game.currentCard}` },
                  playerList,
                  currentCardImage,
                );
                await game.sendToSpecificPlayerList(
                  { caption: `Kartu yang ${nextPlayer!.username} miliki` },
                  playerList,
                  backCardsImage,
                );
              })(),
            ]);

            return;
          }

          // It isn't current chat turn
          await game.removeUserFromArray(chat.user!.id);

          await Promise.all([
            chat.replyToCurrentPerson(
              "Anda berhasil keluar dari game. Terimakasih telah bermain!",
            ),
            game.sendToSpecificPlayerList(
              `${chat.message.userName} telah keluar dari game`,
              afterPlayerWantToLeave,
            ),
          ]);
        }
      }

      break;
    }

    // The default action will waiting or playing, not ended
    case game.state.WAITING:
    default: {
      const creator = await game.getCreatorUser();
      const copiedPlayers = [...game.players];

      // Typeguard
      if (creator) {
        // All player basically gone
        if (copiedPlayers.length < 2) {
          await game.endGame();

          await chat.replyToCurrentPerson(
            "Anda berhasil keluar dari game, tetapi karena hanya anda saja yang berada otomatis game dihentikan. Terimakasih sudah bermain!",
          );
        } else if (copiedPlayers.length > 1) {
          // Current chatter is the creator that want to leave
          if (creator.id === chat.user!.id) {
            // Because the creator always at the index 0
            // So pick the next game creator from copiedPlayers with index 1
            const nextPlayerId = copiedPlayers[1];
            const nextPlayer = await prisma.user.findUnique({
              where: { id: nextPlayerId.playerId },
            });

            const playersList = copiedPlayers
              .filter((player) => player.playerId !== creator.id)
              .filter((player) => player.playerId === nextPlayerId.playerId);

            await game.setCreatorId(nextPlayerId.playerId);
            await game.removeUserFromArray(creator.id);

            await Promise.all([
              chat.replyToCurrentPerson(
                `Anda berhasil keluar dari permainan! Posisi host jatuh ke tangan ${nextPlayer?.username}. Terimakasih sudah bergabung!`,
              ),
              chat.sendToOtherPerson(
                nextPlayer!.phoneNumber,
                `${creator.username} telah keluar dari permainan dan kamu adalah host untuk permainan saat ini.`,
              ),
              game.sendToSpecificPlayerList(
                `${creator.username} telah keluar dari permainan dan host berpindah tangan ke ${nextPlayer?.username} untuk permainan saat ini.`,
                playersList,
              ),
            ]);

            return;
          }

          // Current chatter isn't the creator and want to leave
          const playersList = copiedPlayers.filter(
            (player) => player.playerId !== chat.user!.id,
          );

          await game.removeUserFromArray(chat.user!.id);

          await Promise.all([
            chat.replyToCurrentPerson(
              "Anda berhasil keluar dari permainan. Terimakasih telah bermain!",
            ),
            game.sendToSpecificPlayerList(
              `${chat.message.userName} telah keluar dari permainan`,
              playersList,
            ),
          ]);
        }
      }

      break;
    }
  }
});
