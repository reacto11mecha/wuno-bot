import { DocumentType, isDocument } from "@typegoose/typegoose";
import { Chat } from "./Chat";
import { Game } from "./Game";
import { cards } from "../config/cards";
import { random } from "../utils";

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

const COLOURS = ["red", "green", "blue", "yellow"];
const SPECIAL = ["draw2", "reverse", "skip"];

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
    const idxReduced = Math.floor(random() * reducedByNumbers.length);
    const reducedNumber = reducedByNumbers[idxReduced];

    const idxCard = Math.floor(random() * (cards.length - reducedNumber));
    const card = cards[idxCard];

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
    this.card.cards! = [...this.card.cards!, card];
    await this.game.save();
  }

  async removeCardFromPlayer(card: string) {
    const indexToRemove = this.card.cards!.indexOf(card);
    this.card.cards!.splice(indexToRemove, 1);

    await this.card.save();
  }

  async drawToCurrentPlayer() {
    const nextPlayer = this.game.getNextPosition();
    const newCard = Card.pickRandomCard();

    if (isDocument(nextPlayer)) {
      await this.addNewCard(newCard);
      await this.game.updatePosition(nextPlayer._id);

      const otherPlayer = nextPlayer!.phoneNumber;

      const nextUserCard = await CardModel.findOne({
        game_id: this.game.uid,
        user_id: nextPlayer._id,
      });

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
    const nextPlayer = this.game.getNextPosition();
    const status = this.compareTwoCard(
      this.game.currentCard as allCard,
      givenCard
    );

    switch (status) {
      case "STACK": {
        await Promise.all([
          this.game.updateCardAndPosition(givenCard, nextPlayer!._id),
          this.removeCardFromPlayer(givenCard),
        ]);

        const nextUserCard = await CardModel.findOne({
          game: this.game.uid,
          user: nextPlayer!._id,
        });

        const otherPlayer = nextPlayer!.phoneNumber;

        await Promise.all([
          this.game.sendToOtherPlayersWithoutCurrentPlayer({
            text: `${
              this.chat.message.userName
            } telah mengeluarkan kartu *${givenCard}*, selanjutnya adalah giliran ${
              nextPlayer!.userName
            } untuk bermain`,
          }),
          this.chat.sendToCurrentPerson({
            text: `Berhasil mengeluarkan kartu *${givenCard}*, selanjutnya adalah giliran ${
              nextPlayer!.userName
            } untuk bermain`,
          }),
          this.chat.sendToOtherPerson(otherPlayer, {
            text: `${this.chat.message.userName} telah mengeluarkan kartu *${givenCard}*, Sekarang giliran kamu untuk bermain`,
          }),
        ]);

        await this.chat.sendToOtherPerson(otherPlayer, {
          text: `Kartu saat ini: ${this.game.currentCard}`,
        });
        await this.chat.sendToOtherPerson(otherPlayer, {
          text: `Kartu kamu: ${nextUserCard!.cards?.join(", ")}.`,
        });

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

    switch (true) {
      /* eslint-disable no-fallthrough */

      // If color or number is the same
      case firstState?.color === secState?.color ||
        firstState?.number === secState?.number:

      // Wild color only, stack with specific color
      case firstCard.includes("wild") &&
        regexValidWildColorOnly.test(firstCard) &&
        firstState.type?.replace("wild", "") === secState.color:
        return "STACK";

      // Wild color from current card
      case firstState.state === "VALID_WILD":

      // Valid wild color only from player
      case secState.state === "VALID_WILD":
        return "STACK_WILD";

      // Valid wilddraw4 from player
      case secState.state === "VALID_WILD_PLUS4":
        return "STACK_PLUS_4";
    }

    return "UNMATCH";
  }

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

      case card.includes("wild") && card.includes("draw4"): {
        const color = normalizeCard.match(
          regexValidWildColorPlus4Only
        )![2] as IGetCardState["color"];

        return { state: "VALID_WILD_PLUS4", color };
      }

      case card.includes("wild") && !card.includes("draw4"): {
        const color = normalizeCard.match(
          regexValidWildColorOnly
        )![2] as IGetCardState["color"];

        if (COLOURS.some((eachColor) => card.includes(eachColor))) {
          return {
            state: "VALID_WILD",
            color,
          };
        } else {
          if (!color) return { state: "REQUIRED_ADDITIONAL_COLOR" };
          else if (COLOURS.includes(color))
            return { state: "INVALID_ADDITIONAL_COLOR" };
          else return { state: "VALID_WILD", color };
        }
      }

      case regexValidSpecial.test(normalizeCard): {
        const type = normalizeCard.match(
          regexValidSpecial
        )![2]! as IGetCardState["type"];

        return {
          state: "VALID_SPECIAL",
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
