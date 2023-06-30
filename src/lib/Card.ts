import { Chat } from "./Chat";
import { Game } from "./Game";
import { env } from "../env";
import { createAllCardImage } from "../utils";

import {
  CardPicker,
  cards,
  compareTwoCard,
  regexValidWildColorOnly,
  regexValidWildColorPlus4Only,
} from "../config/cards";

import {
  prisma,
  type FullUserCardType,
  type Player,
} from "../handler/database";

import { MessageMedia } from "whatsapp-web.js";
import type { allCard } from "../config/cards";

/**
 * Class for handling user card
 */
export class Card {
  /**
   * Card document by specific user and game
   */
  private card: FullUserCardType;

  /**
   * Chat message instance
   */
  private chat: Chat;

  /**
   * Game message instance
   */
  private game: Game;

  /**
   * Card class constructor
   * @param cardData Card document by specific user and game
   * @param chat Chat message instance
   * @param game Game message instance
   */
  constructor(cardData: FullUserCardType, chat: Chat, game: Game) {
    this.card = cardData;
    this.chat = chat;
    this.game = game;
  }

  /**
   * Static function for checking a given card is valid or not
   * @param card Valid or invalid card string
   * @returns Boolean that indicate the card is valid or not
   */
  static isValidCard(card: string) {
    return (cards as string[]).includes(
      card.trim().replace(" ", "").toLocaleLowerCase()
    );
  }

  /**
   * Function for adding new card to the current player or specific card id
   * @param cardName Added valid card
   * @param cardId Specific card id (optional)
   */
  async addNewCard(cardName: string, cardId?: number) {
    await prisma.userCard.update({
      where: {
        id: !cardId ? this.card.id : cardId,
      },
      data: {
        cards: {
          create: {
            cardName,
          },
        },
      },
    });
  }

  /**
   * Function for removing specific card from current player (E.G get stacked)
   * @param card Valid given card
   */
  async removeCardFromPlayer(card: string) {
    const specificCard = this.card.cards.find((curr) => curr.cardName === card);

    const updatedCard = await prisma.userCard.update({
      where: {
        id: this.card.id,
      },
      data: {
        cards: {
          delete: {
            id: specificCard?.id,
          },
        },
      },
      include: {
        cards: true,
      },
    });

    this.card = updatedCard!;
  }

  /**
   * Function for retrieving user and game specific card
   * @param user User specific id
   * @returns Card document from specific user and current game id
   */
  async getCardByPlayerAndThisGame(player: Player) {
    const currentUserCard = await prisma.userCard.findFirst({
      where: {
        gameId: player.gameId,
        playerId: player.playerId,
      },
      include: {
        cards: true,
      },
    });

    return currentUserCard?.cards.map((card) => card.cardName) ?? [];
  }

  /**
   * Function for draw a card for current player
   */
  async drawToCurrentPlayer() {
    const nextPlayerId = this.game.getNextPosition();
    const playerList = this.game.players!.filter(
      (player) => player.playerId !== nextPlayerId!.playerId
    );

    const newCard = CardPicker.pickCardByGivenCard(
      this.game.currentCard as allCard
    );

    const nextUserCard = await this.getCardByPlayerAndThisGame(nextPlayerId!);

    const nextPlayer = await prisma.user.findUnique({
      where: {
        id: nextPlayerId?.playerId,
      },
    });

    if (
      nextPlayer &&
      nextUserCard &&
      nextUserCard.length > 0 &&
      playerList &&
      playerList.length > 0
    ) {
      await this.addNewCard(newCard);
      await this.game.updatePosition(nextPlayer.id);

      const nextUserCard = await this.getCardByPlayerAndThisGame(
        this.game.players.find((player) => player.playerId === nextPlayer.id)!
      );
      const [currentCardImage, frontCardsImage, backCardsImage] =
        await createAllCardImage(
          this.game.currentCard as allCard,
          nextUserCard! as allCard[]
        );

      await Promise.all([
        this.sendToCurrentPersonInGame(
          `Berhasil mengambil kartu baru, *${newCard}*. Selanjutnya adalah giliran ${nextPlayer.username} untuk bermain`,
          currentCardImage,
          backCardsImage,
          nextPlayer.username
        ),
        this.sendToOtherPlayersWithoutCurrentPersonInGame(
          `${this.chat.message.userName} telah mengambil kartu, selanjutnya adalah giliran ${nextPlayer.username} untuk bermain`,
          playerList,
          currentCardImage,
          backCardsImage,
          nextPlayer.username
        ),
        this.sendToOtherPersonInGame(
          `${this.chat.message.userName} telah mengambil kartu baru. Sekarang giliran kamu untuk bermain`,
          `Kartu kamu: ${nextUserCard?.join(", ")}.`,
          nextPlayer.phoneNumber,
          currentCardImage,
          frontCardsImage
        ),
      ]);
    }
  }

  /**
   * Function for checking if the user is a winner or not
   * @param notAWinnerCallback If the user not a winner (still in game session)
   * @returns void
   */
  private async checkIsWinner(
    upcomingUserCards: string[],
    notAWinnerCallback: ({
      currentCardImage,
      frontCardsImage,
      backCardsImage,
    }: {
      currentCardImage: MessageMedia;
      frontCardsImage: MessageMedia;
      backCardsImage: MessageMedia;
    }) => Promise<void>
  ) {
    if (this.cards!.length > 0) {
      const [currentCardImage, frontCardsImage, backCardsImage] =
        await createAllCardImage(
          this.game.currentCard as allCard,
          upcomingUserCards as allCard[]
        );

      await notAWinnerCallback({
        currentCardImage,
        frontCardsImage,
        backCardsImage,
      });

      return;
    }

    const winnerProfilePictUrl = await this.chat.getContactProfilePicture();
    const profilePict = await MessageMedia.fromUrl(winnerProfilePictUrl);

    const playerList = this.game.players.filter(
      (player) => player.playerId !== this.chat.user!.id
    );
    await this.game.endGame();

    await this.game.setWinner(this.chat.user!.id);

    const gameDuration = this.game.getElapsedTime();

    await Promise.all([
      // Send message to the winner
      this.chat.sendToCurrentPerson(
        {
          caption: `Selamat! Kamu memenangkan kesempatan permainan kali ini.

Kamu telah memanangkan permainan ini dengan durasi ${gameDuration}.

Game otomatis telah dihentikan. Terimakasih sudah bermain!`,
        },
        profilePict
      ),

      // Send message to the rest of the player
      this.game.sendToSpecificPlayerList(
        {
          caption: `${this.chat.message.userName} memenangkan kesempatan permainan kali ini.

Dia telah memanangkan permainan ini dengan durasi ${gameDuration}.

Game otomatis telah dihentikan. Terimakasih sudah bermain!`,
        },
        playerList,
        profilePict
      ),
    ]);
  }

  /**
   * Function for simplifying send to current person templated message
   * @param text Text that will sended
   * @param currentCardImage A current card image that will sended
   * @param backCardsImage A back cards image that will sended
   * @param nextPlayerName The next player username
   */
  async sendToCurrentPersonInGame(
    text: string,
    currentCardImage: MessageMedia,
    backCardsImage: MessageMedia,
    nextPlayerName: string
  ) {
    await this.chat.sendToCurrentPerson(text);

    await this.chat.sendToCurrentPerson(
      { caption: `Kartu saat ini: ${this.game.currentCard}` },
      currentCardImage
    );
    await this.chat.sendToCurrentPerson(
      { caption: `Kartu yang ${nextPlayerName} miliki` },
      backCardsImage
    );
  }

  /**
   * Function for simplifying send to current other player without current person templated message
   * @param text Text that will sended
   * @param playerList A list of all players that will get the message
   * @param currentCardImage A current card image that will sended
   * @param backCardsImage A back cards image that will sended
   * @param nextPlayerName The next player username
   */
  async sendToOtherPlayersWithoutCurrentPersonInGame(
    text: string,
    playerList: Player[],
    currentCardImage: MessageMedia,
    backCardsImage: MessageMedia,
    nextPlayerName: string
  ) {
    const actualPlayerList = playerList.filter(
      (player) => player.playerId !== this.chat.user!.id
    );

    await this.game.sendToSpecificPlayerList(text, actualPlayerList);

    await this.game.sendToSpecificPlayerList(
      { caption: `Kartu saat ini: ${this.game.currentCard}` },
      actualPlayerList,
      currentCardImage
    );
    await this.game.sendToSpecificPlayerList(
      { caption: `Kartu yang ${nextPlayerName} miliki` },
      actualPlayerList,
      backCardsImage
    );
  }

  /**
   * Function for simplifying send to other person templated message
   * @param firstText The first text in three message that will sended
   * @param lastText The last text in three message that will sended
   * @param phoneNumber The specific person phone number
   * @param currentCardImage A current card image that will sended
   * @param backOrFrontCardsImage A back or front cards image that will sended
   */
  async sendToOtherPersonInGame(
    firstText: string,
    lastText: string,
    phoneNumber: string,
    currentCardImage: MessageMedia,
    backOrFrontCardsImage: MessageMedia
  ) {
    await this.chat.sendToOtherPerson(phoneNumber, firstText);

    await this.chat.sendToOtherPerson(
      phoneNumber,
      { caption: `Kartu saat ini: ${this.game.currentCard}` },
      currentCardImage
    );
    await this.chat.sendToOtherPerson(
      phoneNumber,
      { caption: lastText },
      backOrFrontCardsImage
    );
  }

  /**
   * Function that handle user play event.
   * @param givenCard Valid given card
   */
  async solve(givenCard: allCard) {
    const status = compareTwoCard(this.game.currentCard as allCard, givenCard);

    switch (status) {
      case "STACK": {
        const nextPlayerId = this.game.getNextPosition();
        const playerList = this.game.players!.filter(
          (player) => player.playerId !== nextPlayerId!.playerId
        );

        await this.game.updateCardAndPosition(
          givenCard,
          nextPlayerId!.playerId
        );
        await this.removeCardFromPlayer(givenCard);

        const nextUserCard = await this.getCardByPlayerAndThisGame(
          nextPlayerId!
        );

        const nextPlayer = await prisma.user.findUnique({
          where: {
            id: nextPlayerId?.playerId,
          },
        });

        await this.checkIsWinner(
          nextUserCard,
          async ({ currentCardImage, frontCardsImage, backCardsImage }) => {
            if (
              nextPlayer &&
              nextUserCard &&
              nextUserCard.length > 0 &&
              playerList &&
              playerList.length > 0
            ) {
              await Promise.all([
                this.sendToCurrentPersonInGame(
                  `Berhasil mengeluarkan kartu *${givenCard}*, selanjutnya adalah giliran ${nextPlayer.username} untuk bermain`,
                  currentCardImage,
                  backCardsImage,
                  nextPlayer.username
                ),
                this.sendToOtherPersonInGame(
                  `${this.chat.message.userName} telah mengeluarkan kartu *${givenCard}*, Sekarang giliran kamu untuk bermain`,
                  `Kartu kamu: ${nextUserCard?.join(", ")}.`,
                  nextPlayer.phoneNumber,
                  currentCardImage,
                  frontCardsImage
                ),
                this.sendToOtherPlayersWithoutCurrentPersonInGame(
                  `${this.chat.message.userName} telah mengeluarkan kartu *${givenCard}*, selanjutnya adalah giliran ${nextPlayer.username} untuk bermain`,
                  playerList,
                  currentCardImage,
                  backCardsImage,
                  nextPlayer.username
                ),
              ]);
            }
          }
        );

        break;
      }

      case "VALID_SPECIAL_DRAW2": {
        const nextPlayerId = this.game.getNextPosition();
        const actualNextPlayerId = this.game.getNextPosition(2);

        const playerList = this.game
          .players!.filter(
            (player) => player.playerId !== nextPlayerId!.playerId
          )
          .filter((player) => player.playerId !== actualNextPlayerId!.playerId);

        const newCards = Array.from({ length: 2 }).map(() =>
          CardPicker.pickCardByGivenCard(this.game.currentCard as allCard)
        );

        await this.removeCardFromPlayer(givenCard);

        const nextPlayerCard = await prisma.userCard.findUnique({
          where: {
            playerId: nextPlayerId?.playerId,
          },
        });

        await Promise.all(
          newCards.map((card) => this.addNewCard(card, nextPlayerCard?.id))
        );

        await this.game.updateCardAndPosition(
          givenCard,
          actualNextPlayerId!.playerId
        );

        const nextUserCard = await this.getCardByPlayerAndThisGame(
          actualNextPlayerId!
        );

        const [nextPlayer, actualNextPlayer] = await Promise.all([
          prisma.user.findUnique({
            where: {
              id: nextPlayerId?.playerId,
            },
          }),
          prisma.user.findUnique({
            where: {
              id: actualNextPlayerId?.playerId,
            },
          }),
        ]);

        await this.checkIsWinner(
          nextUserCard,
          async ({ currentCardImage, frontCardsImage, backCardsImage }) => {
            if (
              nextPlayer &&
              actualNextPlayer &&
              nextUserCard &&
              nextUserCard.length > 0
            ) {
              // There are only two players
              if (this.game.players.length === 2) {
                await Promise.all([
                  this.sendToCurrentPersonInGame(
                    `Berhasil menambahkan dua kartu ke ${nextPlayer.username} dengan kartu *${givenCard}*. Sekarang giliran kamu untuk bermain.`,
                    currentCardImage,
                    frontCardsImage,
                    "kamu"
                  ),
                  this.sendToOtherPersonInGame(
                    `Anda ditambahkan dua kartu oleh ${
                      this.chat.message.userName
                    } dengan kartu ${givenCard}. Anda mendapatkan kartu ${newCards
                      .map((card) => `*${card}*`)
                      .join(" dan ")}. Sekarang giliran dia untuk bermain.`,
                    `Kartu yang ${actualNextPlayer.username} miliki`,
                    nextPlayer.phoneNumber,
                    currentCardImage,
                    backCardsImage
                  ),
                ]);

                return;
              }

              // More than two players
              await Promise.all([
                this.sendToCurrentPersonInGame(
                  `Berhasil menambahkan dua kartu ke ${nextPlayer.username} dengan kartu *${givenCard}*. Sekarang giliran ${actualNextPlayer.username} untuk bermain.`,
                  currentCardImage,
                  backCardsImage,
                  actualNextPlayer.username
                ),
                this.sendToOtherPersonInGame(
                  `Anda ditambahkan dua kartu oleh ${
                    this.chat.message.userName
                  } dengan kartu ${givenCard}. Anda mendapatkan kartu ${newCards
                    .map((card) => `*${card}*`)
                    .join(" dan ")}. Sekarang giliran ${
                    actualNextPlayer.username
                  } untuk bermain.`,
                  `Kartu yang ${actualNextPlayer.username} miliki`,
                  nextPlayer.phoneNumber,
                  currentCardImage,
                  backCardsImage
                ),
                this.sendToOtherPersonInGame(
                  `${nextPlayer.username} telah ditambahkan dua kartu oleh ${this.chat.message.userName} dengan kartu ${givenCard}. Sekarang giliran kamu untuk bermain.`,
                  `Kartu kamu: ${nextUserCard?.join(", ")}.`,
                  actualNextPlayer.phoneNumber,
                  currentCardImage,
                  frontCardsImage
                ),
                this.sendToOtherPlayersWithoutCurrentPersonInGame(
                  `${nextPlayer.username} telah ditambahkan dua kartu oleh ${this.chat.message.userName} dengan menggunakan kartu ${givenCard}. Sekarang giliran ${actualNextPlayer.username} untuk bermain.`,
                  playerList,
                  currentCardImage,
                  backCardsImage,
                  actualNextPlayer.username
                ),
              ]);
            }
          }
        );

        break;
      }

      case "VALID_SPECIAL_REVERSE": {
        await this.game.reversePlayersOrder();

        const nextPlayerId = this.game.getNextPosition();
        const playerList = this.game.players!.filter(
          (player) => player !== nextPlayerId!
        );

        await this.game.updateCardAndPosition(
          givenCard,
          nextPlayerId!.playerId
        );
        await this.removeCardFromPlayer(givenCard);

        const nextUserCard = await this.getCardByPlayerAndThisGame(
          nextPlayerId!
        );

        const nextPlayer = await prisma.user.findUnique({
          where: {
            id: nextPlayerId?.playerId,
          },
        });

        await this.checkIsWinner(
          nextUserCard,
          async ({ currentCardImage, frontCardsImage, backCardsImage }) => {
            if (
              nextPlayer &&
              nextUserCard &&
              nextUserCard.length > 0 &&
              playerList &&
              playerList.length > 0
            ) {
              await Promise.all([
                this.sendToCurrentPersonInGame(
                  `Berhasil mengeluarkan kartu *${givenCard}* dan me-reverse permainan, selanjutnya adalah giliran ${nextPlayer.username} untuk bermain`,
                  currentCardImage,
                  backCardsImage,
                  nextPlayer.username
                ),
                this.sendToOtherPlayersWithoutCurrentPersonInGame(
                  `${this.chat.message.userName} telah mengeluarkan kartu *${givenCard}* dan me-reverse permainan, selanjutnya adalah giliran ${nextPlayer.username} untuk bermain`,
                  playerList,
                  currentCardImage,
                  backCardsImage,
                  nextPlayer.username
                ),
                this.sendToOtherPersonInGame(
                  `${this.chat.message.userName} telah mengeluarkan kartu *${givenCard}* dan me-reverse permainan, Sekarang giliran kamu untuk bermain`,
                  `Kartu kamu: ${nextUserCard?.join(", ")}.`,
                  nextPlayer.phoneNumber,
                  currentCardImage,
                  frontCardsImage
                ),
              ]);
            }
          }
        );

        break;
      }

      case "VALID_SPECIAL_SKIP": {
        const nextPlayerId = this.game.getNextPosition();
        const actualNextPlayerId = this.game.getNextPosition(2);

        const playerList = this.game
          .players!.filter(
            (player) => player.playerId !== nextPlayerId!.playerId
          )
          .filter((player) => player.playerId !== actualNextPlayerId!.playerId);

        await this.removeCardFromPlayer(givenCard);

        await this.game.updateCardAndPosition(
          givenCard,
          actualNextPlayerId!.playerId
        );

        const nextUserCard = await this.getCardByPlayerAndThisGame(
          actualNextPlayerId!
        );

        const [nextPlayer, actualNextPlayer] = await Promise.all([
          prisma.user.findUnique({
            where: {
              id: nextPlayerId?.playerId,
            },
          }),
          prisma.user.findUnique({
            where: {
              id: actualNextPlayerId?.playerId,
            },
          }),
        ]);

        await this.checkIsWinner(
          nextUserCard,
          async ({ currentCardImage, frontCardsImage, backCardsImage }) => {
            if (
              nextPlayer &&
              actualNextPlayer &&
              nextUserCard &&
              nextUserCard.length > 0
            ) {
              // There are only two players
              if (this.game.players.length === 2) {
                await Promise.all([
                  this.sendToCurrentPersonInGame(
                    `Berhasil skip pemain ${nextPlayer.username} dengan kartu *${givenCard}*. Sekarang giliran kamu untuk bermain.`,
                    currentCardImage,
                    frontCardsImage,
                    "kamu"
                  ),
                  this.sendToOtherPersonInGame(
                    `Anda telah di skip oleh ${this.chat.message.userName} dengan kartu ${givenCard}. Sekarang giliran dia untuk bermain.`,
                    `Kartu yang ${actualNextPlayer.username} miliki`,
                    nextPlayer.phoneNumber,
                    currentCardImage,
                    backCardsImage
                  ),
                ]);

                return;
              }

              // More than two players
              await Promise.all([
                this.sendToCurrentPersonInGame(
                  `Berhasil menyekip pemain ${nextPlayer.username} dengan kartu *${givenCard}*. Sekarang giliran ${actualNextPlayer.username} untuk bermain.`,
                  currentCardImage,
                  backCardsImage,
                  actualNextPlayer.username
                ),
                this.sendToOtherPersonInGame(
                  `Anda telah di skip oleh ${this.chat.message.userName} dengan kartu ${givenCard}. Sekarang giliran ${actualNextPlayer.username} untuk bermain.`,
                  `Kartu yang ${actualNextPlayer.username} miliki`,
                  nextPlayer.phoneNumber,
                  currentCardImage,
                  backCardsImage
                ),
                this.sendToOtherPersonInGame(
                  `${nextPlayer.username} telah di skip oleh ${this.chat.message.userName} dengan menggunakan kartu ${givenCard}. Sekarang giliran kamu untuk bermain.`,
                  `Kartu kamu: ${nextUserCard?.join(", ")}.`,
                  actualNextPlayer.phoneNumber,
                  currentCardImage,
                  frontCardsImage
                ),
                this.sendToOtherPlayersWithoutCurrentPersonInGame(
                  `${nextPlayer.username} telah di skip oleh ${this.chat.message.userName} dengan menggunakan kartu ${givenCard}. Sekarang giliran ${actualNextPlayer.username} untuk bermain.`,
                  playerList,
                  currentCardImage,
                  backCardsImage,
                  actualNextPlayer.username
                ),
              ]);
            }
          }
        );

        break;
      }

      case "STACK_PLUS_4": {
        const nextPlayerId = this.game.getNextPosition();
        const actualNextPlayerId = this.game.getNextPosition(2);

        const playerList = this.game
          .players!.filter(
            (player) => player.playerId !== nextPlayerId!.playerId
          )
          .filter((player) => player.playerId !== actualNextPlayerId!.playerId);

        const newCards = Array.from({ length: 4 }).map(() =>
          CardPicker.pickCardByGivenCard(this.game.currentCard as allCard)
        );

        await this.removeCardFromPlayer("wilddraw4");

        const nextPlayerCard = await prisma.userCard.findUnique({
          where: {
            playerId: nextPlayerId?.playerId,
          },
        });

        await Promise.all(
          newCards.map((card) => this.addNewCard(card, nextPlayerCard?.id))
        );

        await this.game.updateCardAndPosition(
          givenCard,
          actualNextPlayerId!.playerId
        );

        const nextUserCard = await this.getCardByPlayerAndThisGame(
          actualNextPlayerId!
        );

        const [nextPlayer, actualNextPlayer] = await Promise.all([
          prisma.user.findUnique({
            where: {
              id: nextPlayerId?.playerId,
            },
          }),
          prisma.user.findUnique({
            where: {
              id: actualNextPlayerId?.playerId,
            },
          }),
        ]);

        await this.checkIsWinner(
          nextUserCard,
          async ({ currentCardImage, frontCardsImage, backCardsImage }) => {
            if (
              nextPlayer &&
              actualNextPlayer &&
              nextUserCard &&
              nextUserCard.length > 0
            ) {
              // There are only two players
              if (this.game.players.length === 2) {
                await Promise.all([
                  this.sendToCurrentPersonInGame(
                    `Berhasil menambahkan empat kartu ke ${nextPlayer.username} dengan kartu *${givenCard}*. Sekarang giliran kamu untuk bermain.`,
                    currentCardImage,
                    frontCardsImage,
                    "kamu"
                  ),
                  this.sendToOtherPersonInGame(
                    `Anda ditambahkan empat kartu oleh ${
                      this.chat.message.userName
                    } dengan kartu ${givenCard}. Anda mendapatkan kartu ${newCards
                      .map(
                        (card, idx) => `${idx === 3 ? " dan " : ""}*${card}*`
                      )
                      .join(", ")}. Sekarang giliran dia untuk bermain.`,
                    `Kartu yang ${actualNextPlayer.username} miliki`,
                    nextPlayer.phoneNumber,
                    currentCardImage,
                    backCardsImage
                  ),
                ]);

                return;
              }

              // More than two players
              await Promise.all([
                this.sendToCurrentPersonInGame(
                  `Berhasil menambahkan empat kartu ke ${nextPlayer.username} dengan kartu *${givenCard}*. Sekarang giliran ${actualNextPlayer.username} untuk bermain.`,
                  currentCardImage,
                  backCardsImage,
                  actualNextPlayer.username
                ),
                this.sendToOtherPersonInGame(
                  `Anda ditambahkan empat kartu oleh ${
                    this.chat.message.userName
                  } dengan kartu ${givenCard}. Anda mendapatkan kartu ${newCards
                    .map((card, idx) => `${idx === 3 ? " dan " : ""}*${card}*`)
                    .join(", ")}. Sekarang giliran ${
                    actualNextPlayer.username
                  } untuk bermain.`,
                  `Kartu yang ${actualNextPlayer.username} miliki`,
                  nextPlayer.phoneNumber,
                  currentCardImage,
                  backCardsImage
                ),
                this.sendToOtherPersonInGame(
                  `${nextPlayer.username} telah ditambahkan empat kartu oleh ${this.chat.message.userName} dengan menggunakan kartu ${givenCard}. Sekarang giliran kamu untuk bermain.`,
                  `Kartu kamu: ${nextUserCard?.join(", ")}.`,
                  actualNextPlayer.phoneNumber,
                  currentCardImage,
                  frontCardsImage
                ),
                this.sendToOtherPlayersWithoutCurrentPersonInGame(
                  `${nextPlayer.username} telah ditambahkan empat kartu oleh ${this.chat.message.userName} dengan menggunakan kartu ${givenCard}. Sekarang giliran ${actualNextPlayer.username} untuk bermain.`,
                  playerList,
                  currentCardImage,
                  backCardsImage,
                  actualNextPlayer.username
                ),
              ]);
            }
          }
        );

        break;
      }

      case "STACK_WILD": {
        const nextPlayerId = this.game.getNextPosition();
        const playerList = this.game.players!.filter(
          (player) => player !== nextPlayerId!
        );

        await this.game.updateCardAndPosition(
          givenCard,
          nextPlayerId!.playerId
        );
        await this.removeCardFromPlayer("wild");

        const nextUserCard = await this.getCardByPlayerAndThisGame(
          nextPlayerId!
        );

        const nextPlayer = await prisma.user.findUnique({
          where: {
            id: nextPlayerId?.playerId,
          },
        });

        await this.checkIsWinner(
          nextUserCard,
          async ({ currentCardImage, frontCardsImage, backCardsImage }) => {
            if (
              nextPlayer &&
              nextUserCard &&
              nextUserCard.length > 0 &&
              playerList &&
              playerList.length > 0
            ) {
              await Promise.all([
                this.sendToCurrentPersonInGame(
                  `Berhasil mengeluarkan kartu pilih warna dengan kartu *${givenCard}*, selanjutnya adalah giliran ${nextPlayer.username} untuk bermain`,
                  currentCardImage,
                  backCardsImage,
                  nextPlayer.username
                ),
                this.sendToOtherPlayersWithoutCurrentPersonInGame(
                  `${this.chat.message.userName} telah mengeluarkan kartu pilih warna dengan kartu *${givenCard}*, selanjutnya adalah giliran ${nextPlayer.username} untuk bermain`,
                  playerList,
                  currentCardImage,
                  backCardsImage,
                  nextPlayer.username
                ),
                this.sendToOtherPersonInGame(
                  `${this.chat.message.userName} telah mengeluarkan kartu pilih warna dengan kartu *${givenCard}*, Sekarang giliran kamu untuk bermain`,
                  `Kartu kamu: ${nextUserCard?.join(", ")}.`,
                  nextPlayer.phoneNumber,
                  currentCardImage,
                  frontCardsImage
                ),
              ]);
            }
          }
        );

        break;
      }

      case "UNMATCH": {
        await this.chat.sendToCurrentPerson(
          `Kartu *${givenCard}* tidak valid jika disandingkan dengan kartu *${this.game.currentCard}*! Jika tidak memiliki kartu lagi, ambil dengan '${env.PREFIX}d' untuk mengambil kartu baru.`
        );
      }
    }
  }

  /**
   * Function for checking is player has a specific given card or not
   * @param card Valid given card
   * @returns Boolean that indicate is current player has a card or not
   */
  isIncluded(card: string) {
    if (card.match(regexValidWildColorOnly))
      return this.cards?.includes("wild");
    else if (card.match(regexValidWildColorPlus4Only))
      return this.cards?.includes("wilddraw4");
    else return this.cards?.includes(card);
  }

  /**
   * Get all cards name from current player
   */
  get cards() {
    return this.card.cards.map((card) => card.cardName);
  }
}
