import { HydratedDocument } from "mongoose";
import { Chat } from "./Chat";
import { Game } from "./Game";
import { cards, type allCard } from "../config/cards.js";
import { random } from "../utils";

import CardModel from "../models/card";

import type { ICard } from "../models/card";

const COLOURS = ["red", "green", "blue", "yellow"];
const SPECIAL = ["draw2", "reverse", "skip"];

const regexValidNormal = new RegExp(`^(${COLOURS.join("|")})[0-9]$`);
const regexValidSpecial = new RegExp(
  `^(${COLOURS.join("|")})(${SPECIAL.join("|")})$`
);
const regexValidWildColorOnly = new RegExp(`^(wild)(${COLOURS.join("|")})$`);
const regexValidWildColorPlus4Only = new RegExp(
  `^(wilddraw4)(${COLOURS.join("|")})$`
);

const reducedByNumbers = [...new Array(14)].map((_, idx) => idx);
const filteredWildColor = cards
  .filter((card) => !regexValidWildColorOnly.test(card))
  .filter((card) => !regexValidWildColorPlus4Only.test(card));

export class Card {
  card: HydratedDocument<ICard> | null;
  chat: Chat;
  game: Game;

  constructor(
    cardData: HydratedDocument<ICard> | null,
    chat: Chat,
    game: Game
  ) {
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

  // static isValidCard(card: string | allCard) {
  //   return cards.includes(card.trim().replace(" ", "").toLocaleLowerCase());
  // }

  // isIncluded(card: string | allCard) {
  //   return this.card?.cards.includes(card);
  // }

  async removeCardFromPlayer(card: allCard) {
    const indexToRemove = this.card?.cards.indexOf(card) as number;
    this.card?.cards.splice(indexToRemove, 1);

    await this.card?.save();
  }

  async addNewCard(card: allCard) {
    this.card?.cards.push(card);
    await this.card?.save();
  }

  // getCardState(card: string, color: typeof COLOURS) {
  //   const normalizeCard = card.trim().toLowerCase();

  //   switch (true) {
  //     case regexValidNormal.test(normalizeCard): {
  //       const color = normalizeCard.match(
  //         regexValidNormal
  //       )[1] as unknown as string;
  //       const number = Number(normalizeCard.slice(color.length));

  //       return { state: "VALID_NORMAL", color, number };
  //     }

  //     case card.includes("wild") && card.includes("draw4"): {
  //       const color = regexValidWildColorPlus4Only.match(regexValidNormal)[2];

  //       return { state: "VALID_WILD_PLUS4", color };
  //     }

  //     case card.includes("wild") && !card.includes("draw4"): {
  //       if (COLOURS.some((eachColor) => card.includes(eachColor))) {
  //         const color = normalizeCard.match(regexValidWildColorOnly)[2];

  //         return {
  //           state: "VALID_WILD",
  //           color,
  //         };
  //       } else {
  //         if (!color) return "REQUIRED_ADDITIONAL_COLOR";
  //         else if (COLOURS.includes(color)) return "INVALID_ADDITIONAL_COLOR";
  //         else {
  //           return { state: "VALID_WILD", color };
  //         }
  //       }
  //     }

  //     case regexValidSpecial.test(normalizeCard): {
  //       const type = normalizeCard.match(regexValidSpecial)[2];

  //       return {
  //         state: "VALID_SPECIAL",
  //         type,
  //       };
  //     }

  //     default: {
  //       return { state: "INVALID" };
  //     }
  //   }
  // }

  // compareTwoCard(firstCard, secCard, color) {
  //   const firstState = this.getCardState(firstCard);
  //   const secState = this.getCardState(secCard, color);

  //   switch (true) {
  //     /* eslint-disable no-fallthrough */

  //     // If color or number is the same
  //     case firstState?.color === secState?.color ||
  //       firstState?.number === secState?.number:

  //     // Wild color only, stack with specific color
  //     case firstCard.includes("wild") &&
  //       regexValidWildColorOnly.test(firstCard) &&
  //       firstState.type.replace("wild", "") === secState.color:
  //       return "STACK";

  //     // Wild color from current card
  //     case firstState.type === "VALID_WILD":

  //     // Valid wild color only from player
  //     case secState.state === "VALID_WILD":
  //       if (!color) {
  //         return "REQUIRED_ADDITIONAL_COLOR";
  //       } else if (!COLOURS.includes(color)) {
  //         return "INVALID_ADDITIONAL_COLOR";
  //       } else {
  //         return "STACK_WILD";
  //       }

  //     // Valid wilddraw4 from player
  //     case secState.state === "VALID_WILD_PLUS4":
  //       if (!color) {
  //         return "REQUIRED_ADDITIONAL_COLOR";
  //       } else if (!COLOURS.includes(color)) {
  //         return "INVALID_ADDITIONAL_COLOR";
  //       } else {
  //         return "STACK_PLUS_4";
  //       }
  //   }

  //   return "UNMATCH";
  // }

  // async drawToCurrentPlayer() {
  //   const nextPlayer = this.game.getNextPosition();
  //   const newCard = Card.pickRandomCard();

  //   await this.addNewCard(newCard);
  //   await this.game.updatePosition(nextPlayer._id);
  //   const otherPlayer = `${nextPlayer.phoneNumber.replace(
  //     "+",
  //     ""
  //   )}@s.whatsapp.net`;

  //   this.card = await CardModel.findOne({
  //     game_id: this.game.id,
  //     user_id: nextPlayer._id,
  //   });

  //   await Promise.all([
  //     this.game.sendToOtherPlayersWithoutCurrentPlayer(
  //       `${this.chat.message.userName} telah mengambil kartu, selanjutnya adalah giliran ${nextPlayer.userName} untuk bermain`
  //     ),
  //     this.chat.sendToCurrentPerson({
  //       text: `Berhasil mengambil kartu baru, *${newCard}*. selanjutnya adalah giliran ${nextPlayer.userName} untuk bermain`,
  //     }),
  //     this.chat.sendToOtherPerson(otherPlayer, {
  //       text: `${this.chat.message.userName} telah mengambil kartu baru, Sekarang giliran kamu untuk bermain`,
  //     }),
  //   ]);

  //   await this.chat.sendToOtherPerson(otherPlayer, {
  //     text: `Kartu saat ini: ${this.game.currentCard}`,
  //   });
  //   await this.chat.sendToOtherPerson(otherPlayer, {
  //     text: `Kartu kamu: ${this.card?.cards.join(", ")}.`,
  //   });
  // }

  // async solve(givenCard: string | allCard[]) {
  //   const nextPlayer = this.game.getNextPosition();
  //   const status = this.compareTwoCard(this.game.currentCard, givenCard);

  //   switch (status) {
  //     case "STACK": {
  //       await Promise.all([
  //         this.game.updateCardAndPosition(givenCard, nextPlayer),
  //         this.removeCardFromPlayer(givenCard),
  //       ]);

  //       this.card = await CardModel.findOne({
  //         game_id: this.game.id,
  //         user_id: nextPlayer._id,
  //       });

  //       const otherPlayer = `${nextPlayer.phoneNumber.replace(
  //         "+",
  //         ""
  //       )}@s.whatsapp.net`;

  //       await Promise.all([
  //         this.game.sendToOtherPlayersWithoutCurrentPlayer(
  //           `${this.chat.message.userName} telah mengeluarkan kartu *${givenCard}*, selanjutnya adalah giliran ${nextPlayer.userName} untuk bermain`
  //         ),
  //         this.chat.sendToCurrentPerson({
  //           text: `Berhasil mengeluarkan kartu *${givenCard}*, selanjutnya adalah giliran ${nextPlayer.userName} untuk bermain`,
  //         }),
  //         this.chat.sendToOtherPerson(otherPlayer, {
  //           text: `${this.chat.message.userName} telah mengeluarkan kartu *${givenCard}*, Sekarang giliran kamu untuk bermain`,
  //         }),
  //       ]);

  //       await this.chat.sendToOtherPerson(otherPlayer, {
  //         text: `Kartu saat ini: ${this.game.currentCard}`,
  //       });
  //       await this.chat.sendToOtherPerson(otherPlayer, {
  //         text: `Kartu kamu: ${this.card?.cards.join(", ")}.`,
  //       });

  //       break;
  //     }
  //     case "UNMATCH": {
  //       await this.chat.sendToCurrentPerson({
  //         text: `Kartu *${givenCard}*, tidak valid jika disandingkan dengan kartu *${this.game.currentCard}*! Jika tidak memiliki kartu lagi, ambil dengan '${process.env.PREFIX}d' untuk mengambil kartu baru.`,
  //       });
  //     }
  //   }
  // }

  get cards() {
    return this.card?.cards;
  }
}
