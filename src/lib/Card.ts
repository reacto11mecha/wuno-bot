import { Chat } from "./Chat";
import { Game } from "./Game";
import { cards, type allCard } from "../config/cards";
import { random } from "../utils";

// import { databaseSource } from "../handler/database";
import { Card as CardModel } from "../entity";

// const COLOURS = ["red", "green", "blue", "yellow"];
// const SPECIAL = ["draw2", "reverse", "skip"];

// const regexValidNormal = new RegExp(`^(${COLOURS.join("|")})[0-9]$`);
// const regexValidSpecial = new RegExp(
//   `^(${COLOURS.join("|")})(${SPECIAL.join("|")})$`
// );
// const regexValidWildColorOnly = new RegExp(`^(wild)(${COLOURS.join("|")})$`);
// const regexValidWildColorPlus4Only = new RegExp(
//   `^(wilddraw4)(${COLOURS.join("|")})$`
// );

const reducedByNumbers = [...new Array(14)].map((_, idx) => idx);
// const filteredWildColor = cards
//   .filter((card) => !regexValidWildColorOnly.test(card))
//   .filter((card) => !regexValidWildColorPlus4Only.test(card));

export class Card {
  card: CardModel;
  chat: Chat;
  game: Game;

  constructor(cardData: CardModel, chat: Chat, game: Game) {
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
}
