import {
  DocumentType,
  isRefType,
  isDocument,
  isDocumentArray,
  Ref,
} from "@typegoose/typegoose";
import { Types } from "mongoose";

import { Chat } from "./Chat";
import { Game } from "./Game";
import { PREFIX } from "../config/prefix";
import { createAllCardImage } from "../utils";

import {
  cards,
  regexValidWildColorOnly,
  regexValidWildColorPlus4Only,
} from "../config/cards";

import { Card as CardType, CardModel, User } from "../models";
import { MessageMedia } from "whatsapp-web.js";
import type { allCard } from "../config/cards";

import { CardPicker, compareTwoCard } from "../config/cards";

/**
 * Class for handling user card
 */
export class Card {
  /**
   * Card document by specific user and game
   */
  private card: DocumentType<CardType>;

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
  constructor(cardData: DocumentType<CardType>, chat: Chat, game: Game) {
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
   * @param card Added valid card
   * @param cardId Specific card id (optional)
   */
  async addNewCard(card: string, cardId?: Types.ObjectId) {
    await CardModel.findOneAndUpdate(
      { _id: !cardId ? this.card._id : cardId },
      { $push: { cards: card } }
    );
  }

  /**
   * Function for removing specific card from current player (E.G get stacked)
   * @param card Valid given card
   */
  async removeCardFromPlayer(card: string) {
    const indexToRemove = this.card.cards!.indexOf(card);
    this.card.cards!.splice(indexToRemove, 1);

    await this.card.save();
  }

  /**
   * Function for retrieving user and game specific card
   * @param user User specific id
   * @returns Card document from specific user and current game id
   */
  async getCardByUserAndThisGame(user: Types.ObjectId) {
    return await CardModel.findOne({
      game: this.game.uid,
      user,
    });
  }

  /**
   * Function for draw a card for current player
   */
  async drawToCurrentPlayer() {
    const nextPlayer = this.game.getNextPosition();
    const playerList = this.game.players!.filter(
      (player) => isDocument(player) && player._id !== nextPlayer!._id
    );

    const newCard = CardPicker.pickCardByGivenCard(
      this.game.currentCard as allCard
    );

    if (isDocument(nextPlayer) && isDocumentArray(playerList)) {
      await this.addNewCard(newCard);
      await this.game.updatePosition(nextPlayer._id);

      const otherPlayer = nextPlayer!.phoneNumber;

      const nextUserCard = await this.getCardByUserAndThisGame(nextPlayer._id);

      const [currentCardImage, frontCardsImage, backCardsImage] =
        await createAllCardImage(
          this.game.currentCard as allCard,
          nextUserCard!.cards as allCard[]
        );

      await Promise.all([
        (async () => {
          await this.game.sendToOtherPlayersWithoutCurrentPerson(
            `${this.chat.message.userName} telah mengambil kartu, selanjutnya adalah giliran ${nextPlayer.userName} untuk bermain`,
            playerList
          );

          await this.game.sendToOtherPlayersWithoutCurrentPerson(
            { caption: `Kartu saat ini: ${this.game.currentCard}` },
            playerList,
            currentCardImage
          );
          await this.game.sendToOtherPlayersWithoutCurrentPerson(
            {
              caption: `Kartu yang ${
                isDocument(this.game.currentPlayer)
                  ? this.game.currentPlayer.userName
                  : ""
              } miliki`,
            },
            playerList,
            backCardsImage
          );
        })(),
        (async () => {
          await this.chat.sendToCurrentPerson(
            `Berhasil mengambil kartu baru, *${newCard}*. Selanjutnya adalah giliran ${nextPlayer.userName} untuk bermain`
          );

          await this.chat.sendToCurrentPerson(
            { caption: `Kartu saat ini: ${this.game.currentCard}` },
            currentCardImage
          );
          await this.chat.sendToCurrentPerson(
            {
              caption: `Kartu yang ${
                isDocument(this.game.currentPlayer)
                  ? this.game.currentPlayer.userName
                  : ""
              } miliki`,
            },
            backCardsImage
          );
        })(),
        (async () => {
          await this.chat.sendToOtherPerson(
            otherPlayer,
            `${this.chat.message.userName} telah mengambil kartu baru. Sekarang giliran kamu untuk bermain`
          );

          await this.chat.sendToOtherPerson(
            otherPlayer,
            { caption: `Kartu saat ini: ${this.game.currentCard}` },
            currentCardImage
          );
          await this.chat.sendToOtherPerson(
            otherPlayer,
            { caption: `Kartu kamu: ${nextUserCard?.cards?.join(", ")}.` },
            frontCardsImage
          );
        })(),
      ]);
    }
  }

  /**
   * Function for checking if the user is a winner or not
   * @param notAWinnerCallback If the user not a winner (still in game session)
   * @returns void
   */
  private async checkIsWinner(notAWinnerCallback: () => Promise<void>) {
    if (this.cards!.length > 0) return await notAWinnerCallback();

    const winnerProfilePictUrl = await this.chat.getContactProfilePicture();
    const profilePict = await MessageMedia.fromUrl(winnerProfilePictUrl);

    const playerList = this.game.players;
    await this.game.endGame();

    const gameDuration = this.game.getElapsedTime();

    await Promise.all([
      this.chat.sendToCurrentPerson(
        {
          caption: `Selamat! Kamu memenangkan kesempatan permainan kali ini.

Kamu telah memanangkan permainan ini dengan durasi ${gameDuration}.

Game otomatis telah dihentikan. Terimakasih sudah bermain!`,
        },
        profilePict
      ),
      this.game.sendToOtherPlayersWithoutCurrentPerson(
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
    playerList: Ref<User, Types.ObjectId>[],
    currentCardImage: MessageMedia,
    backCardsImage: MessageMedia,
    nextPlayerName: string
  ) {
    await this.game.sendToOtherPlayersWithoutCurrentPerson(text, playerList);

    await this.game.sendToOtherPlayersWithoutCurrentPerson(
      { caption: `Kartu saat ini: ${this.game.currentCard}` },
      playerList,
      currentCardImage
    );
    await this.game.sendToOtherPlayersWithoutCurrentPerson(
      { caption: `Kartu yang ${nextPlayerName} miliki` },
      playerList,
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
   * Function that handle user play event
   * @param givenCard Valid given card
   */
  async solve(givenCard: allCard) {
    const status = compareTwoCard(this.game.currentCard as allCard, givenCard);

    switch (status) {
      case "STACK": {
        const nextPlayer = this.game.getNextPosition();
        const playerList = this.game.players!.filter(
          (player) => isDocument(player) && player._id !== nextPlayer!._id
        );

        await Promise.all([
          this.game.updateCardAndPosition(givenCard, nextPlayer!._id),
          this.removeCardFromPlayer(givenCard),
        ]);

        const nextUserCard = await this.getCardByUserAndThisGame(
          nextPlayer!._id
        );

        await this.checkIsWinner(async () => {
          if (
            isDocument(nextPlayer) &&
            isDocument(nextUserCard) &&
            isDocumentArray(playerList)
          ) {
            const [currentCardImage, frontCardsImage, backCardsImage] =
              await createAllCardImage(
                this.game.currentCard as allCard,
                nextUserCard!.cards as allCard[]
              );

            await Promise.all([
              this.sendToCurrentPersonInGame(
                `Berhasil mengeluarkan kartu *${givenCard}*, selanjutnya adalah giliran ${nextPlayer.userName} untuk bermain`,
                currentCardImage,
                backCardsImage,
                nextPlayer.userName
              ),
              this.sendToOtherPlayersWithoutCurrentPersonInGame(
                `${this.chat.message.userName} telah mengeluarkan kartu *${givenCard}*, selanjutnya adalah giliran ${nextPlayer.userName} untuk bermain`,
                playerList,
                currentCardImage,
                backCardsImage,
                nextPlayer.userName
              ),
              this.sendToOtherPersonInGame(
                `${this.chat.message.userName} telah mengeluarkan kartu *${givenCard}*, Sekarang giliran kamu untuk bermain`,
                `Kartu kamu: ${nextUserCard.cards?.join(", ")}.`,
                nextPlayer.phoneNumber,
                currentCardImage,
                frontCardsImage
              ),
            ]);
          }
        });

        break;
      }

      case "VALID_SPECIAL_DRAW2": {
        const nextPlayer = this.game.getNextPosition();
        const actualNextPlayer = this.game.getNextPosition(2);
        const playerList = this.game
          .players!.filter(
            (player) => isDocument(player) && player._id !== nextPlayer!._id
          )
          .filter(
            (player) =>
              isDocument(player) && player._id !== actualNextPlayer!._id
          );

        const newCards = Array.from(new Array(2)).map(() =>
          CardPicker.pickCardByGivenCard(this.game.currentCard as allCard)
        );

        await Promise.all([
          this.game.updateCardAndPosition(givenCard, actualNextPlayer!._id),
          (async () => {
            await this.removeCardFromPlayer(givenCard);

            if (
              isDocument(nextPlayer) &&
              isRefType(nextPlayer.gameProperty!.card, Types.ObjectId)
            ) {
              await this.addNewCard(newCards[0], nextPlayer.gameProperty!.card);
              await this.addNewCard(newCards[1], nextPlayer.gameProperty!.card);
            }
          })(),
        ]);

        const nextUserCard = await this.getCardByUserAndThisGame(
          actualNextPlayer!._id
        );

        await this.checkIsWinner(async () => {
          if (
            isDocument(nextPlayer) &&
            isDocument(actualNextPlayer) &&
            isDocument(nextUserCard) &&
            isDocumentArray(playerList)
          ) {
            const [currentCardImage, frontCardsImage, backCardsImage] =
              await createAllCardImage(
                this.game.currentCard as allCard,
                nextUserCard!.cards as allCard[]
              );

            await Promise.all([
              this.sendToCurrentPersonInGame(
                `Berhasil menambahkan dua kartu ke ${nextPlayer.userName} dengan kartu *${givenCard}*. Sekarang giliran ${actualNextPlayer.userName} untuk bermain.`,
                currentCardImage,
                backCardsImage,
                actualNextPlayer.userName
              ),
              this.sendToOtherPersonInGame(
                `Anda ditambahkan dua kartu oleh ${
                  this.chat.message.userName
                } dengan kartu ${givenCard}. Anda mendapatkan kartu ${newCards
                  .map((card) => `*${card}*`)
                  .join(" dan ")}. Sekarang giliran ${
                  actualNextPlayer.userName
                } untuk bermain.`,
                `Kartu yang ${actualNextPlayer.userName} miliki`,
                nextPlayer.phoneNumber,
                currentCardImage,
                backCardsImage
              ),
              this.sendToOtherPersonInGame(
                `${nextPlayer.userName} telah ditambahkan dua kartu oleh ${this.chat.message.userName} dengan kartu ${givenCard}. Sekarang giliran kamu untuk bermain.`,
                `Kartu kamu: ${nextUserCard!.cards?.join(", ")}.`,
                actualNextPlayer.phoneNumber,
                currentCardImage,
                frontCardsImage
              ),
              this.sendToOtherPlayersWithoutCurrentPersonInGame(
                `${nextPlayer.userName} telah ditambahkan dua kartu oleh ${this.chat.message.userName} dengan menggunakan kartu ${givenCard}. Sekarang giliran ${actualNextPlayer.userName} untuk bermain.`,
                playerList,
                currentCardImage,
                backCardsImage,
                actualNextPlayer.userName
              ),
            ]);
          }
        });

        break;
      }

      case "VALID_SPECIAL_REVERSE": {
        await this.game.reversePlayersOrder();

        const nextPlayer = this.game.getNextPosition();
        const playerList = this.game.players!.filter(
          (player) => isDocument(player) && player._id !== nextPlayer!._id
        );

        await Promise.all([
          this.game.updateCardAndPosition(givenCard, nextPlayer!._id),
          this.removeCardFromPlayer(givenCard),
        ]);

        const nextUserCard = await this.getCardByUserAndThisGame(
          nextPlayer!._id
        );

        await this.checkIsWinner(async () => {
          if (
            isDocument(nextPlayer) &&
            isDocument(nextUserCard) &&
            isDocumentArray(playerList)
          ) {
            const [currentCardImage, frontCardsImage, backCardsImage] =
              await createAllCardImage(
                this.game.currentCard as allCard,
                nextUserCard!.cards as allCard[]
              );

            await Promise.all([
              this.sendToCurrentPersonInGame(
                `Berhasil mengeluarkan kartu *${givenCard}* dan me-reverse permainan, selanjutnya adalah giliran ${nextPlayer.userName} untuk bermain`,
                currentCardImage,
                backCardsImage,
                nextPlayer.userName
              ),
              this.sendToOtherPlayersWithoutCurrentPersonInGame(
                `${this.chat.message.userName} telah mengeluarkan kartu *${givenCard}* dan me-reverse permainan, selanjutnya adalah giliran ${nextPlayer.userName} untuk bermain`,
                playerList,
                currentCardImage,
                backCardsImage,
                nextPlayer.userName
              ),
              this.sendToOtherPersonInGame(
                `${this.chat.message.userName} telah mengeluarkan kartu *${givenCard}* dan me-reverse permainan, Sekarang giliran kamu untuk bermain`,

                `Kartu kamu: ${nextUserCard?.cards?.join(", ")}.`,
                nextPlayer.phoneNumber,
                currentCardImage,
                frontCardsImage
              ),
            ]);
          }
        });

        break;
      }

      case "VALID_SPECIAL_SKIP": {
        const nextPlayer = this.game.getNextPosition();
        const actualNextPlayer = this.game.getNextPosition(2);
        const playerList = this.game
          .players!.filter(
            (player) => isDocument(player) && player._id !== nextPlayer!._id
          )
          .filter(
            (player) =>
              isDocument(player) && player._id !== actualNextPlayer!._id
          );

        await Promise.all([
          this.game.updateCardAndPosition(givenCard, actualNextPlayer!._id),
          this.removeCardFromPlayer(givenCard),
        ]);

        const nextUserCard = await this.getCardByUserAndThisGame(
          actualNextPlayer!._id
        );

        await this.checkIsWinner(async () => {
          if (
            isDocument(nextPlayer) &&
            isDocument(actualNextPlayer) &&
            isDocument(nextUserCard) &&
            isDocumentArray(playerList)
          ) {
            const [currentCardImage, frontCardsImage, backCardsImage] =
              await createAllCardImage(
                this.game.currentCard as allCard,
                nextUserCard!.cards as allCard[]
              );

            await Promise.all([
              this.sendToCurrentPersonInGame(
                `Berhasil menyekip pemain ${nextPlayer.userName} dengan kartu *${givenCard}*. Sekarang giliran ${actualNextPlayer.userName} untuk bermain.`,
                currentCardImage,
                backCardsImage,
                actualNextPlayer.userName
              ),
              this.sendToOtherPersonInGame(
                `Anda telah di skip oleh ${this.chat.message.userName} dengan kartu ${givenCard}. Sekarang giliran ${actualNextPlayer.userName} untuk bermain.`,
                `Kartu yang ${actualNextPlayer.userName} miliki`,
                nextPlayer.phoneNumber,
                currentCardImage,
                backCardsImage
              ),
              this.sendToOtherPersonInGame(
                `${nextPlayer.userName} telah di skip oleh ${this.chat.message.userName} dengan menggunakan kartu ${givenCard}. Sekarang giliran kamu untuk bermain.`,
                `Kartu kamu: ${nextUserCard!.cards?.join(", ")}.`,
                actualNextPlayer.phoneNumber,
                currentCardImage,
                frontCardsImage
              ),
              this.sendToOtherPlayersWithoutCurrentPersonInGame(
                `${nextPlayer.userName} telah di skip oleh ${this.chat.message.userName} dengan menggunakan kartu ${givenCard}. Sekarang giliran ${actualNextPlayer.userName} untuk bermain.`,
                playerList,
                currentCardImage,
                backCardsImage,
                actualNextPlayer.userName
              ),
            ]);
          }
        });

        break;
      }

      case "STACK_PLUS_4": {
        const nextPlayer = this.game.getNextPosition();
        const actualNextPlayer = this.game.getNextPosition(2);
        const playerList = this.game
          .players!.filter(
            (player) => isDocument(player) && player._id !== nextPlayer!._id
          )
          .filter(
            (player) =>
              isDocument(player) && player._id !== actualNextPlayer!._id
          );

        const newCards = Array.from(new Array(4)).map(() =>
          CardPicker.pickCardByGivenCard(this.game.currentCard as allCard)
        );

        await Promise.all([
          this.game.updateCardAndPosition(givenCard, actualNextPlayer!._id),
          (async () => {
            await this.removeCardFromPlayer("wilddraw4");

            if (
              isDocument(nextPlayer) &&
              isRefType(nextPlayer.gameProperty!.card, Types.ObjectId)
            ) {
              await this.addNewCard(newCards[0], nextPlayer.gameProperty!.card);
              await this.addNewCard(newCards[1], nextPlayer.gameProperty!.card);
              await this.addNewCard(newCards[2], nextPlayer.gameProperty!.card);
              await this.addNewCard(newCards[3], nextPlayer.gameProperty!.card);
            }
          })(),
        ]);

        const nextUserCard = await this.getCardByUserAndThisGame(
          actualNextPlayer!._id
        );

        await this.checkIsWinner(async () => {
          if (
            isDocument(nextPlayer) &&
            isDocument(actualNextPlayer) &&
            isDocument(nextUserCard) &&
            isDocumentArray(playerList)
          ) {
            const [currentCardImage, frontCardsImage, backCardsImage] =
              await createAllCardImage(
                this.game.currentCard as allCard,
                nextUserCard!.cards as allCard[]
              );

            await Promise.all([
              this.sendToCurrentPersonInGame(
                `Berhasil menambahkan empat kartu ke ${nextPlayer.userName} dengan kartu *${givenCard}*. Sekarang giliran ${actualNextPlayer.userName} untuk bermain.`,
                currentCardImage,
                backCardsImage,
                actualNextPlayer.userName
              ),
              this.sendToOtherPersonInGame(
                `Anda ditambahkan empat kartu oleh ${
                  this.chat.message.userName
                } dengan kartu ${givenCard}. Anda mendapatkan kartu ${newCards
                  .map((card, idx) => `${idx === 3 ? " dan " : ""}*${card}*`)
                  .join(", ")}. Sekarang giliran ${
                  actualNextPlayer.userName
                } untuk bermain.`,
                `Kartu yang ${actualNextPlayer.userName} miliki`,
                nextPlayer.phoneNumber,
                currentCardImage,
                backCardsImage
              ),
              this.sendToOtherPersonInGame(
                `${nextPlayer.userName} telah ditambahkan empat kartu oleh ${this.chat.message.userName} dengan menggunakan kartu ${givenCard}. Sekarang giliran kamu untuk bermain.`,
                `Kartu kamu: ${nextUserCard!.cards?.join(", ")}.`,
                actualNextPlayer.phoneNumber,
                currentCardImage,
                frontCardsImage
              ),
              this.sendToOtherPlayersWithoutCurrentPersonInGame(
                `${nextPlayer.userName} telah ditambahkan empat kartu oleh ${this.chat.message.userName} dengan menggunakan kartu ${givenCard}. Sekarang giliran ${actualNextPlayer.userName} untuk bermain.`,
                playerList,
                currentCardImage,
                backCardsImage,
                actualNextPlayer.userName
              ),
            ]);
          }
        });

        break;
      }

      case "STACK_WILD": {
        const nextPlayer = this.game.getNextPosition();
        const playerList = this.game.players!.filter(
          (player) => isDocument(player) && player._id !== nextPlayer!._id
        );

        await Promise.all([
          this.game.updateCardAndPosition(givenCard, nextPlayer!._id),
          await this.removeCardFromPlayer("wild"),
        ]);

        const nextUserCard = await this.getCardByUserAndThisGame(
          nextPlayer!._id
        );

        await this.checkIsWinner(async () => {
          if (
            isDocument(nextPlayer) &&
            isDocument(nextUserCard) &&
            isDocumentArray(playerList)
          ) {
            const [currentCardImage, frontCardsImage, backCardsImage] =
              await createAllCardImage(
                this.game.currentCard as allCard,
                nextUserCard!.cards as allCard[]
              );

            await Promise.all([
              this.sendToCurrentPersonInGame(
                `Berhasil mengeluarkan kartu pilih warna dengan kartu *${givenCard}*, selanjutnya adalah giliran ${nextPlayer.userName} untuk bermain`,
                currentCardImage,
                backCardsImage,
                nextPlayer.userName
              ),
              this.sendToOtherPlayersWithoutCurrentPersonInGame(
                `${this.chat.message.userName} telah mengeluarkan kartu pilih warna dengan kartu *${givenCard}*, selanjutnya adalah giliran ${nextPlayer.userName} untuk bermain`,
                playerList,
                currentCardImage,
                backCardsImage,
                nextPlayer.userName
              ),
              this.sendToOtherPersonInGame(
                `${this.chat.message.userName} telah mengeluarkan kartu pilih warna dengan kartu *${givenCard}*, Sekarang giliran kamu untuk bermain`,
                `Kartu kamu: ${nextUserCard.cards?.join(", ")}.`,
                nextPlayer.phoneNumber,
                currentCardImage,
                frontCardsImage
              ),
            ]);
          }
        });

        break;
      }

      case "UNMATCH": {
        await this.chat.sendToCurrentPerson(
          `Kartu *${givenCard}* tidak valid jika disandingkan dengan kartu *${this.game.currentCard}*! Jika tidak memiliki kartu lagi, ambil dengan '${PREFIX}d' untuk mengambil kartu baru.`
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
      return this.card.cards?.includes("wild");
    else if (card.match(regexValidWildColorPlus4Only))
      return this.card.cards?.includes("wilddraw4");
    else return this.card.cards?.includes(card);
  }

  /**
   * Get all cards from current player
   */
  get cards() {
    return this.card.cards;
  }
}
