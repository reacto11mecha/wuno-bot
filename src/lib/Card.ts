import {
  DocumentType,
  isDocument,
  isDocumentArray,
} from "@typegoose/typegoose";
import { Types } from "mongoose";

import { Chat } from "./Chat";
import { Game } from "./Game";
import { cards } from "../config/cards";

import { Card as CardType, CardModel } from "../models";
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

// const COLOURS = ["red", "green", "blue", "yellow"];
// const SPECIAL = ["draw2", "reverse", "skip"];

const regexValidNormal = /^(red|green|blue|yellow)[0-9]$/;
const regexValidSpecial = /^(red|green|blue|yellow)(draw2|reverse|skip)$/;
const regexValidWildColorOnly = /^(wild)(red|green|blue|yellow)$/;
const regexValidWildColorPlus4Only = /^(wilddraw4)(red|green|blue|yellow)$/;

const reducedByNumbers = [...new Array(14)].map((_, idx) => idx);
const filteredWildColor = cards
  .filter((card) => !regexValidWildColorOnly.test(card))
  .filter((card) => !regexValidWildColorPlus4Only.test(card));

export class Card {
  private card: DocumentType<CardType>;
  private chat: Chat;
  private game: Game;

  constructor(cardData: DocumentType<CardType>, chat: Chat, game: Game) {
    this.card = cardData;
    this.chat = chat;
    this.game = game;
  }

  static pickRandomCard(): allCard {
    const idxReduced = Math.floor(Math.random() * reducedByNumbers.length);
    const reducedNumber = reducedByNumbers[idxReduced];

    const idxCard = Math.floor(Math.random() * (cards.length - reducedNumber));
    const card = filteredWildColor[idxCard];

    // Prevent null card value
    if (!card) return Card.pickRandomCard();
    return card;
  }

  static isValidCard(card: string) {
    return (cards as string[]).includes(
      card.trim().replace(" ", "").toLocaleLowerCase()
    );
  }

  async addNewCard(card: string) {
    await CardModel.findOneAndUpdate(
      { _id: this.card._id },
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
    const newCard = Card.pickRandomCard();

    if (isDocument(nextPlayer)) {
      await this.addNewCard(newCard);
      await this.game.updatePosition(nextPlayer._id);

      const otherPlayer = nextPlayer!.phoneNumber;

      const nextUserCard = await this.getCardByUserAndThisGame(nextPlayer._id);

      await Promise.all([
        this.game.sendToOtherPlayersWithoutCurrentPlayer({
          text: `${this.chat.message.userName} telah mengambil kartu, selanjutnya adalah giliran ${nextPlayer.userName} untuk bermain`,
        }),
        this.chat.sendToCurrentPerson({
          text: `Berhasil mengambil kartu baru, *${newCard}*. selanjutnya adalah giliran ${nextPlayer.userName} untuk bermain`,
        }),
        this.chat.sendToOtherPerson(otherPlayer, {
          text: `${this.chat.message.userName} telah mengambil kartu baru, Sekarang giliran kamu untuk bermain`,
        }),
      ]);

      await this.chat.sendToOtherPerson(otherPlayer, {
        text: `Kartu saat ini: ${this.game.currentCard}`,
      });
      await this.chat.sendToOtherPerson(otherPlayer, {
        text: `Kartu kamu: ${nextUserCard?.cards?.join(", ")}.`,
      });
    }
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

        if (
          isDocument(nextPlayer) &&
          isDocument(nextUserCard) &&
          isDocumentArray(playerList)
        ) {
          await Promise.all([
            this.chat.sendToCurrentPerson({
              text: `Berhasil mengeluarkan kartu *${givenCard}*, selanjutnya adalah giliran ${nextPlayer.userName} untuk bermain`,
            }),
            this.game.sendToOtherPlayersWithoutCurrentPerson(
              {
                text: `${this.chat.message.userName} telah mengeluarkan kartu *${givenCard}*, selanjutnya adalah giliran ${nextPlayer.userName} untuk bermain`,
              },
              playerList
            ),
            (async () => {
              const phoneNumber = nextPlayer.phoneNumber;

              await this.chat.sendToOtherPerson(phoneNumber, {
                text: `${this.chat.message.userName} telah mengeluarkan kartu *${givenCard}*, Sekarang giliran kamu untuk bermain`,
              });

              await this.chat.sendToOtherPerson(phoneNumber, {
                text: `Kartu saat ini: ${this.game.currentCard}`,
              });
              await this.chat.sendToOtherPerson(phoneNumber, {
                text: `Kartu kamu: ${nextUserCard.cards?.join(", ")}.`,
              });
            })(),
          ]);
        }

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

        const newCards = [Card.pickRandomCard(), Card.pickRandomCard()];

        await Promise.all([
          this.game.updateCardAndPosition(givenCard, actualNextPlayer!._id),
          this.removeCardFromPlayer(givenCard),
          newCards.map((card) => this.addNewCard(card)),
        ]);

        const nextUserCard = await this.getCardByUserAndThisGame(
          actualNextPlayer!._id
        );

        if (
          isDocument(nextPlayer) &&
          isDocument(actualNextPlayer) &&
          isDocument(nextUserCard) &&
          isDocumentArray(playerList)
        ) {
          await Promise.all([
            this.chat.sendToOtherPerson(nextPlayer.phoneNumber, {
              text: `Anda ditambahkan dua kartu oleh ${
                this.chat.message.userName
              } dengan kartu ${givenCard}. Anda mendapatkan kartu ${newCards
                .map((card) => `*${card}*`)
                .join(" dan ")}. Sekarang giliran ${
                actualNextPlayer.userName
              } untuk bermain.`,
            }),
            this.game.sendToOtherPlayersWithoutCurrentPerson(
              {
                text: `${nextPlayer.userName} telah ditambahkan dua kartu oleh ${this.chat.message.userName} dengan menggunakan kartu ${givenCard}. Sekarang giliran ${actualNextPlayer.userName} untuk bermain.`,
              },
              playerList
            ),
            (async () => {
              const phoneNumber = actualNextPlayer.phoneNumber;

              await this.chat.sendToOtherPerson(phoneNumber, {
                text: `${nextPlayer.userName} telah ditambahkan dua skip oleh ${this.chat.message.userName} dengan menggunakan kartu ${givenCard}. Sekarang giliran kamu untuk bermain.`,
              });
              await this.chat.sendToOtherPerson(phoneNumber, {
                text: `Kartu saat ini: ${this.game.currentCard}`,
              });
              await this.chat.sendToOtherPerson(phoneNumber, {
                text: `Kartu saat ini: ${this.game.currentCard}`,
              });
              await this.chat.sendToOtherPerson(phoneNumber, {
                text: `Kartu kamu: ${nextUserCard!.cards?.join(", ")}.`,
              });
            })(),
          ]);
        }
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

        if (
          isDocument(nextPlayer) &&
          isDocument(nextUserCard) &&
          isDocumentArray(playerList)
        ) {
          await Promise.all([
            this.chat.sendToCurrentPerson({
              text: `Berhasil mengeluarkan kartu *${givenCard}* dan me-reverse permainan, selanjutnya adalah giliran ${nextPlayer.userName} untuk bermain`,
            }),
            this.game.sendToOtherPlayersWithoutCurrentPerson(
              {
                text: `${this.chat.message.userName} telah mengeluarkan kartu *${givenCard}* dan me-reverse permainan, selanjutnya adalah giliran ${nextPlayer.userName} untuk bermain`,
              },
              playerList
            ),
            (async () => {
              const phoneNumber = nextPlayer.phoneNumber;

              await this.chat.sendToOtherPerson(phoneNumber, {
                text: `${this.chat.message.userName} telah mengeluarkan kartu *${givenCard}*, Sekarang giliran kamu untuk bermain`,
              });

              await this.chat.sendToOtherPerson(phoneNumber, {
                text: `Kartu saat ini: ${this.game.currentCard}`,
              });
              await this.chat.sendToOtherPerson(phoneNumber, {
                text: `Kartu kamu: ${nextUserCard.cards?.join(", ")}.`,
              });
            })(),
          ]);
        }
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

        if (
          isDocument(nextPlayer) &&
          isDocument(actualNextPlayer) &&
          isDocument(nextUserCard) &&
          isDocumentArray(playerList)
        ) {
          await Promise.all([
            this.chat.sendToOtherPerson(nextPlayer.phoneNumber, {
              text: `Anda telah di skip oleh ${this.chat.message.userName} dengan kartu ${givenCard}. Sekarang giliran ${actualNextPlayer.userName} untuk bermain.`,
            }),
            this.game.sendToOtherPlayersWithoutCurrentPerson(
              {
                text: `${nextPlayer.userName} telah di skip oleh ${this.chat.message.userName} dengan menggunakan kartu ${givenCard}. Sekarang giliran ${actualNextPlayer.userName} untuk bermain.`,
              },
              playerList
            ),
            (async () => {
              const phoneNumber = actualNextPlayer.phoneNumber;

              await this.chat.sendToOtherPerson(phoneNumber, {
                text: `${nextPlayer.userName} telah di skip oleh ${this.chat.message.userName} dengan menggunakan kartu ${givenCard}. Sekarang giliran kamu untuk bermain.`,
              });
              await this.chat.sendToOtherPerson(phoneNumber, {
                text: `Kartu saat ini: ${this.game.currentCard}`,
              });
              await this.chat.sendToOtherPerson(phoneNumber, {
                text: `Kartu saat ini: ${this.game.currentCard}`,
              });
              await this.chat.sendToOtherPerson(phoneNumber, {
                text: `Kartu kamu: ${nextUserCard!.cards?.join(", ")}.`,
              });
            })(),
          ]);
        }

        break;
      }

      case "UNMATCH": {
        await this.chat.sendToCurrentPerson({
          text: `Kartu *${givenCard}*, tidak valid jika disandingkan dengan kartu *${this.game.currentCard}*! Jika tidak memiliki kartu lagi, ambil dengan '${process.env.PREFIX}d' untuk mengambil kartu baru.`,
        });
      }
    }
  }

  isIncluded(card: string) {
    return this.card.cards?.includes(card);
  }

  compareTwoCard(firstCard: allCard, secCard: allCard) {
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

      case switchState.FIRSTCARD_IS_COLOR_OR_NUMBER_IS_SAME:

      // Wild color only, stack with specific color
      case switchState.FIRSTCARD_IS_WILD_OR_WILD4_IS_SAME_SECOND_COLOR:
        return "STACK";

      case switchState.FIRSTCARD_IS_NTYPE_AND_SECONDCARD_IS_NTYPE_TOO:
      case switchState.SECONDCARD_IS_VALIDSPECIAL_AND_SAME_COLOR_AS_FIRSTCARD:
        return `VALID_SPECIAL_${secState.type!.toUpperCase()}`;

      // Valid wild color only from player
      case switchState.SECONDCARD_IS_WILD:
        return "STACK_WILD";

      // Valid wilddraw4 from player
      case switchState.SECONDCARD_IS_WILD4:
        return "STACK_PLUS_4";
    }

    return "UNMATCH";
  }

  getSwitchState(firstState: IGetCardState, secState: IGetCardState) {
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
  getCardState(card: allCard): IGetCardState {
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
