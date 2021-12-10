import ChatLib from "./Chat.js";
import GameLib from "./Game.js";
import CardModel from "../models/card.js";
import mongoose from "mongoose";

import cards from "../config/cards.js";

const COLOURS = ["red", "green", "blue", "yellow"];
const SPECIAL = ["draw2", "reverse", "skip"];

const regexValidNormal = new RegExp(`^(${COLOURS.join("|")})[0-9]$`);
const regexValidWild = new RegExp(`^(wild)(${COLOURS.join("|")}|draw4)$`);
const regexValidSpecial = new RegExp(
  `^(${COLOURS.join("|")})(${SPECIAL.join("|")})$`
);

export default class Card {
  constructor(cardData, chat, game) {
    if (!(chat instanceof ChatLib)) throw new Error("Invalid Chat argument!");
    else if (!(game instanceof GameLib))
      throw new Error("Invalid Game argument!");
    else if (!game.state.WAITING && !(cardData instanceof CardModel))
      throw new Error("Invalid Card data!");

    this.card = cardData;
    this.chat = chat;
    this.game = game;
  }

  static isValidCard(card) {
    return cards.includes(card.trim().replace(" ", "").toLocaleLowerCase());
  }

  isIncluded(card) {
    return this.card.cards.includes(card);
  }

  getNextPosition() {
    const playerOrder = [...this.game.game.playerOrder];
    const currentPlayer = this.game.currentPlayer;

    const currentIndex = playerOrder.findIndex((player) =>
      player._id.equals(currentPlayer._id)
    );
    const nextPlayerID = playerOrder[(currentIndex + 1) % playerOrder.length];

    return this.game.players.find((player) =>
      player._id.equals(nextPlayerID._id)
    );
  }

  async removeCardFromPlayer(card) {
    const indexToRemove = this.card.cards.indexOf(card);
    this.card.cards.splice(indexToRemove, 1);

    await this.card.save();
  }

  async reversePlayerOrder() {
    const copyArray = [...this.game.playerOrder];
    const reversedArray = copyArray.reverse();

    this.game.playerOrder = reversedArray;
    await this.game.save();
  }

  getCardState(card) {
    const normalizeCard = card.trim().toLowerCase();

    if (regexValidNormal.test(normalizeCard)) {
      const color = normalizeCard.match(regexValidNormal)[1];
      const number = Number(normalizeCard.slice(color.length));

      return { state: "VALID_NORMAL", color, number };
    } else if (regexValidWild.test(normalizeCard)) {
      const type = normalizeCard.match(regexValidWild)[2];

      return {
        state: "VALID_WILD",
        type,
      };
    } else if (regexValidSpecial.test(normalizeCard)) {
      const type = normalizeCard.match(regexValidSpecial)[2];

      return {
        state: "VALID_SPECIAL",
        type,
      };
    } else {
      return {
        state: "INVALID",
      };
    }
  }

  compareTwoCard(firstCard, secCard) {
    const firstState = this.getCardState(firstCard);
    const secState = this.getCardState(secCard);

    if (firstState?.color === secState?.color) return "STACK";
    if (firstState?.number === secState?.number) return "STACK";
  }

  async solve(givenCard) {
    const nextPlayer = this.getNextPosition();
    const status = this.compareTwoCard(this.game.currentCard, givenCard);

    switch (status) {
      case "STACK":
        await Promise.all([
          this.game.updateCardAndPosition(givenCard, nextPlayer),
          this.removeCardFromPlayer(givenCard),
        ]);

        this.card = await CardModel.findOne({
          game_id: this.game.game._id,
          user_id: nextPlayer._id,
        });
        const otherPlayer = `${nextPlayer.phoneNumber.replace("+", "")}@c.us`;

        await Promise.all([
          this.game.sendToOtherPlayersWithoutCurrentPlayer(
            `${this.chat.username} telah mengeluarkan kartu *${givenCard}*, selanjutnya adalah giliran ${nextPlayer.userName} untuk bermain`
          ),
          this.chat.sendToCurrentPerson(
            `Berhasil mengeluarkan kartu *${givenCard}*, selanjutnya adalah giliran ${nextPlayer.userName} untuk bermain`
          ),
          this.chat.sendToOtherPlayer(
            otherPlayer,
            `${this.chat.username} telah telah mengeluarkan kartu *${givenCard}*, Sekarang giliran kamu untuk bermain`
          ),
        ]);

        await this.chat.sendToOtherPlayer(
          otherPlayer,
          `Kartu saat ini: ${this.game.currentCard}`
        );
        await this.chat.sendToOtherPlayer(
          otherPlayer,
          `Kartu kamu: ${this.card.cards.join(", ")}.`
        );

        break;
    }
  }
}
