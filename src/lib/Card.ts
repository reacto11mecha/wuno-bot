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
  regexValidNormal,
  regexValidSpecial,
  regexValidWildColorOnly,
  regexValidWildColorPlus4Only,
} from "../config/cards";

import { Card as CardType, CardModel, User } from "../models";
import type {
  allCard,
  color as colorType,
  possibleNumber,
} from "../config/cards";

export interface IGetCardState {
  state:
    | "VALID_NORMAL"
    | "VALID_WILD_PLUS4"
    | "VALID_WILD"
    | "VALID_SPECIAL"
    | "REQUIRED_ADDITIONAL_COLOR"
    | "INVALID_ADDITIONAL_COLOR"
    | "INVALID";
  color?: colorType;
  number?: possibleNumber;
  type?: "draw2" | "reverse" | "skip";
}

import { CardPicker } from "../config/cards";

export class Card {
  private card: DocumentType<CardType>;
  private chat: Chat;
  private game: Game;

  constructor(cardData: DocumentType<CardType>, chat: Chat, game: Game) {
    this.card = cardData;
    this.chat = chat;
    this.game = game;
  }

  static isValidCard(card: string) {
    return (cards as string[]).includes(
      card.trim().replace(" ", "").toLocaleLowerCase()
    );
  }

  async addNewCard(card: string, cardId?: Types.ObjectId) {
    await CardModel.findOneAndUpdate(
      { _id: !cardId ? this.card._id : cardId },
      { $push: { cards: card } }
    );
  }

  async removeCardFromPlayer(card: string) {
    const indexToRemove = this.card.cards!.indexOf(card);
    this.card.cards!.splice(indexToRemove, 1);

    await this.card.save();
  }

  async getCardByUserAndThisGame(user: Types.ObjectId) {
    return await CardModel.findOne({
      game: this.game.uid,
      user,
    });
  }

  async drawToCurrentPlayer() {
    const nextPlayer = this.game.getNextPosition();
    const playerList = this.game.players!.filter(
      (player) => isDocument(player) && player._id !== nextPlayer!._id
    );

    const newCard = CardPicker.pickRandomCard();

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
            {
              text: `${this.chat.message.userName} telah mengambil kartu, selanjutnya adalah giliran ${nextPlayer.userName} untuk bermain`,
            },
            playerList
          );

          await this.game.sendToOtherPlayersWithoutCurrentPerson(
            {
              image: currentCardImage,
              caption: `Kartu saat ini: ${this.game.currentCard}`,
            },
            playerList
          );
          await this.game.sendToOtherPlayersWithoutCurrentPerson(
            {
              image: backCardsImage,
              caption: `Kartu yang ${
                isDocument(this.game.currentPlayer)
                  ? this.game.currentPlayer.userName
                  : ""
              } miliki`,
            },
            playerList
          );
        })(),
        (async () => {
          await this.chat.sendToCurrentPerson({
            text: `Berhasil mengambil kartu baru, *${newCard}*. selanjutnya adalah giliran ${nextPlayer.userName} untuk bermain`,
          });

          await this.chat.sendToCurrentPerson({
            image: currentCardImage,
            caption: `Kartu saat ini: ${this.game.currentCard}`,
          });
          await this.chat.sendToCurrentPerson({
            image: backCardsImage,
            caption: `Kartu yang ${
              isDocument(this.game.currentPlayer)
                ? this.game.currentPlayer.userName
                : ""
            } miliki`,
          });
        })(),
        (async () => {
          await this.chat.sendToOtherPerson(otherPlayer, {
            text: `${this.chat.message.userName} telah mengambil kartu baru, Sekarang giliran kamu untuk bermain`,
          });

          await this.chat.sendToOtherPerson(otherPlayer, {
            image: currentCardImage,
            caption: `Kartu saat ini: ${this.game.currentCard}`,
          });
          await this.chat.sendToOtherPerson(otherPlayer, {
            image: frontCardsImage,
            caption: `Kartu kamu: ${nextUserCard?.cards?.join(", ")}.`,
          });
        })(),
      ]);
    }
  }

  private async checkIsWinner(notAWinnerCallback: () => Promise<void>) {
    if (this.cards!.length > 0) return await notAWinnerCallback();

    const playerList = this.game.players;
    await this.game.endGame();

    const gameDuration = this.game.getElapsedTime();

    await Promise.all([
      this.chat.sendToCurrentPerson({
        text: `Selamat! Kamu memenangkan kesempatan permainan kali ini.

Kamu telah memanangkan permainan ini dengan durasi ${gameDuration}.

Game otomatis telah dihentikan. Terimakasih sudah bermain!`,
      }),
      this.game.sendToOtherPlayersWithoutCurrentPerson(
        {
          text: `${this.chat.message.userName} memenangkan kesempatan permainan kali ini.

Dia telah memanangkan permainan ini dengan durasi ${gameDuration}.

Game otomatis telah dihentikan. Terimakasih sudah bermain!`,
        },
        playerList
      ),
    ]);
  }

  async sendToCurrentPersonInGame(
    text: string,
    currentCardImage: Buffer,
    backCardsImage: Buffer,
    nextPlayerName: string
  ) {
    await this.chat.sendToCurrentPerson({
      text,
    });

    await this.chat.sendToCurrentPerson({
      image: currentCardImage,
      caption: `Kartu saat ini: ${this.game.currentCard}`,
    });
    await this.chat.sendToCurrentPerson({
      image: backCardsImage,
      caption: `Kartu yang ${nextPlayerName} miliki`,
    });
  }

  async sendToOtherPlayersWithoutCurrentPersonInGame(
    text: string,
    playerList: Ref<User, Types.ObjectId | undefined>[] | undefined,
    currentCardImage: Buffer,
    backCardsImage: Buffer,
    nextPlayerName: string
  ) {
    await this.game.sendToOtherPlayersWithoutCurrentPerson(
      {
        text,
      },
      playerList
    );

    await this.game.sendToOtherPlayersWithoutCurrentPerson(
      {
        image: currentCardImage,
        caption: `Kartu saat ini: ${this.game.currentCard}`,
      },
      playerList
    );
    await this.game.sendToOtherPlayersWithoutCurrentPerson(
      {
        image: backCardsImage,
        caption: `Kartu yang ${nextPlayerName} miliki`,
      },
      playerList
    );
  }

  async sendToOtherPersonInGame(
    firstText: string,
    lastText: string,
    phoneNumber: string,
    currentCardImage: Buffer,
    backOrFrontCardsImage: Buffer
  ) {
    await this.chat.sendToOtherPerson(phoneNumber, {
      text: firstText,
    });

    await this.chat.sendToOtherPerson(phoneNumber, {
      image: currentCardImage,
      caption: `Kartu saat ini: ${this.game.currentCard}`,
    });
    await this.chat.sendToOtherPerson(phoneNumber, {
      image: backOrFrontCardsImage,
      caption: lastText,
    });
  }

  async solve(givenCard: allCard) {
    const status = this.compareTwoCard(
      this.game.currentCard as allCard,
      givenCard
    );

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
          CardPicker.pickRandomCard()
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
          CardPicker.pickRandomCard()
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
        await this.chat.sendToCurrentPerson({
          text: `Kartu *${givenCard}*, tidak valid jika disandingkan dengan kartu *${this.game.currentCard}*! Jika tidak memiliki kartu lagi, ambil dengan '${PREFIX}d' untuk mengambil kartu baru.`,
        });
      }
    }
  }

  isIncluded(card: string) {
    if (card.match(regexValidWildColorOnly))
      return this.card.cards?.includes("wild");
    else if (card.match(regexValidWildColorPlus4Only))
      return this.card.cards?.includes("wilddraw4");
    else return this.card.cards?.includes(card);
  }

  private compareTwoCard(firstCard: allCard, secCard: allCard) {
    const firstState = this.getCardState(firstCard);
    const secState = this.getCardState(secCard);

    if (
      secState.state === "REQUIRED_ADDITIONAL_COLOR" ||
      secState.state === "INVALID_ADDITIONAL_COLOR"
    )
      return secState.state;

    const switchState = this.getSwitchState(firstState, secState);

    switch (true) {
      /* eslint-disable no-fallthrough */

      // Valid wilddraw4 from player
      case switchState.SECONDCARD_IS_WILD4:
        return "STACK_PLUS_4";

      // Valid wild color only from player
      case switchState.SECONDCARD_IS_WILD:
        return "STACK_WILD";

      case switchState.FIRSTCARD_IS_COLOR_OR_NUMBER_IS_SAME:

      case switchState.FIRSTCARD_IS_NTYPE_AND_SECONDCARD_IS_NTYPE_TOO:
      case switchState.SECONDCARD_IS_VALIDSPECIAL_AND_SAME_COLOR_AS_FIRSTCARD:
        return `VALID_SPECIAL_${secState.type!.toUpperCase()}`;

      // Wild color only, stack with specific color
      case switchState.FIRSTCARD_IS_WILD_OR_WILD4_IS_SAME_SECOND_COLOR:
        return "STACK";

      default:
        return "UNMATCH";
    }
  }

  private getSwitchState(firstState: IGetCardState, secState: IGetCardState) {
    /**
     * If the color or number is the same, but it's not special or plus4 card
     */
    const FIRSTCARD_IS_COLOR_OR_NUMBER_IS_SAME =
      (firstState?.color === secState?.color ||
        firstState?.number === secState?.number) &&
      secState.state !== "VALID_SPECIAL";

    /**
     * If the first card is the wild and the color of second card is the same
     * or the first card is the plus4 and the color of second card is the same
     */
    const FIRSTCARD_IS_WILD_OR_WILD4_IS_SAME_SECOND_COLOR =
      (firstState.state === "VALID_WILD" &&
        firstState.color === secState.color) ||
      (firstState.state === "VALID_WILD_PLUS4" &&
        firstState.color === secState.color);

    /**
     * If the second card is special card and the color
     * of the second card is the same as the first card color
     */
    const SECONDCARD_IS_VALIDSPECIAL_AND_SAME_COLOR_AS_FIRSTCARD =
      secState.state === "VALID_SPECIAL" && secState.color === firstState.color;

    /**
     * If the first card is special card and the type of
     * the second card is the same as the first card type
     */
    const FIRSTCARD_IS_NTYPE_AND_SECONDCARD_IS_NTYPE_TOO =
      firstState.state === "VALID_SPECIAL" &&
      secState.state === "VALID_SPECIAL" &&
      firstState.type === secState.type;

    /**
     * If the second card is wild card or in the other word is color only
     */
    const SECONDCARD_IS_WILD = secState.state === "VALID_WILD";

    /**
     * If the second card is plus4 card
     */
    const SECONDCARD_IS_WILD4 = secState.state === "VALID_WILD_PLUS4";

    return {
      FIRSTCARD_IS_COLOR_OR_NUMBER_IS_SAME,
      FIRSTCARD_IS_WILD_OR_WILD4_IS_SAME_SECOND_COLOR,
      SECONDCARD_IS_VALIDSPECIAL_AND_SAME_COLOR_AS_FIRSTCARD,
      FIRSTCARD_IS_NTYPE_AND_SECONDCARD_IS_NTYPE_TOO,
      SECONDCARD_IS_WILD,
      SECONDCARD_IS_WILD4,
    };
  }

  /**
   * Get the state of the current card (normal card, wild card, etc.)
   * @param card Valid given card
   * @returns Object of the card state
   */
  private getCardState(card: allCard): IGetCardState {
    const normalizeCard = card.trim().toLowerCase();

    switch (true) {
      case regexValidNormal.test(normalizeCard): {
        const color = normalizeCard.match(
          regexValidNormal
        )![1] as IGetCardState["color"];
        const number = Number(
          normalizeCard.slice(color!.length)
        )! as IGetCardState["number"];

        return { state: "VALID_NORMAL", color, number };
      }

      case regexValidWildColorPlus4Only.test(normalizeCard): {
        const color = normalizeCard.match(
          regexValidWildColorPlus4Only
        )![2] as IGetCardState["color"];

        return { state: "VALID_WILD_PLUS4", color };
      }

      case regexValidWildColorOnly.test(normalizeCard): {
        const color = normalizeCard.match(
          regexValidWildColorOnly
        )![2] as IGetCardState["color"];

        return {
          state: "VALID_WILD",
          color,
        };
      }

      case regexValidSpecial.test(normalizeCard): {
        const color = normalizeCard.match(
          regexValidSpecial
        )![1]! as IGetCardState["color"];
        const type = normalizeCard.match(
          regexValidSpecial
        )![2]! as IGetCardState["type"];

        return {
          state: "VALID_SPECIAL",
          color,
          type,
        };
      }

      default: {
        return { state: "INVALID" };
      }
    }
  }

  get cards() {
    return this.card.cards;
  }
}
