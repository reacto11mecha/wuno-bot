import cards from "../config/cards.js";

const COLOURS = ["red", "green", "blue", "yellow"];
const SPECIAL = ["draw2", "reverse", "skip"];

const regexValidNormal = new RegExp(`^(${COLOURS.join("|")})[0-9]$`);
const regexValidWild = new RegExp(`^(wild)(${COLOURS.join("|")}|draw4)$`);
const regexValidSpecial = new RegExp(
  `^(${COLOURS.join("|")})(${SPECIAL.join("|")})$`
);

export default class Card {
  constructor(card, user, game, players, client) {
    this.card = card;
    this.user = user;
    this.game = game;
    this.players = players;
    this.client = client;
  }

  static isValidCard(card) {
    return cards.includes(card.trim().replace(" ", "").toLocaleLowerCase());
  }

  getNextPosition() {
    const playerOrder = this.game.playerOrder;
    const currentPlayer = this.game.currentPosition;

    const currentIndex = playerOrder.findIndex((player) =>
      player._id.equals(currentPlayer)
    );
    const nextPlayerID = playerOrder[(currentIndex + 1) % playerOrder.length];

    return this.players.find((player) => player._id.equals(nextPlayerID._id));
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

  async sayToCurrentPlayer() {}

  async sayToNextPlayer() {}

  async solve(givenCard) {
    const nextPlayer = this.getNextPosition();
    const status = this.compareTwoCard(this.game.currentCard, givenCard);

    switch (status) {
      case "STACK":
        this.game.currentCard = givenCard;
        this.game.currentPosition = nextPlayer;

        await this.game.save();
    }
  }
}
