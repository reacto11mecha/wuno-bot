import { cards, type allCard } from "../config/cards.js";
import { random } from "../utils";

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
