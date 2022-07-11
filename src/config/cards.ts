import { random, getRandom, randomWithBias } from "../utils";

export type color = "red" | "green" | "blue" | "yellow";
export type possibleNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type allCard =
  | `${color}${possibleNumber}`
  | `wild${color}`
  | `wilddraw4${color}`
  | `${color}reverse`
  | `${color}skip`
  | `${color}draw2`
  | "wild"
  | "wilddraw4";

export enum EGetCardState {
  VALID_NORMAL,
  VALID_WILD_PLUS4,
  VALID_WILD,
  VALID_SPECIAL,
  INVALID,
}

export interface IGetCardState {
  state: EGetCardState;
  color?: color;
  number?: possibleNumber;
  type?: "draw2" | "reverse" | "skip";
}

export const cards: allCard[] = [
  "red0",
  "red1",
  "red2",
  "red3",
  "red4",
  "red5",
  "red6",
  "red7",
  "red8",
  "red9",
  "wildred",
  "wilddraw4red",

  "green0",
  "green1",
  "green2",
  "green3",
  "green4",
  "green5",
  "green6",
  "green7",
  "green8",
  "green9",
  "wildgreen",
  "wilddraw4green",

  "blue0",
  "blue1",
  "blue2",
  "blue3",
  "blue4",
  "blue5",
  "blue6",
  "blue7",
  "blue8",
  "blue9",
  "wildblue",
  "wilddraw4blue",

  "yellow0",
  "yellow1",
  "yellow2",
  "yellow3",
  "yellow4",
  "yellow5",
  "yellow6",
  "yellow7",
  "yellow8",
  "yellow9",
  "wildyellow",
  "wilddraw4yellow",

  // Lucky system
  "wild",

  "redreverse",
  "redskip",
  "reddraw2",

  "greenreverse",
  "greenskip",
  "greendraw2",

  "bluereverse",
  "blueskip",
  "bluedraw2",

  "yellowreverse",
  "yellowskip",
  "yellowdraw2",

  "wilddraw4",
];

export const regexValidNormal = /^(red|green|blue|yellow)[0-9]$/;
export const regexValidSpecial =
  /^(red|green|blue|yellow)(draw2|reverse|skip)$/;
export const regexValidWildColorOnly = /^(wild)(red|green|blue|yellow)$/;
export const regexValidWildColorPlus4Only =
  /^(wilddraw4)(red|green|blue|yellow)$/;

const reducedByNumbers = [...new Array(14)].map((_, idx) => idx);
const filteredWildColor = cards
  .filter((card) => !regexValidWildColorOnly.test(card))
  .filter((card) => !regexValidWildColorPlus4Only.test(card));
const appropriateInitialCards = cards
  .filter((e) => !e.startsWith("wild"))
  .filter((e) => !e.endsWith("skip"))
  .filter((e) => !e.endsWith("draw2"))
  .filter((e) => !e.endsWith("reverse"));

const filterCardByGivenCard = {
  ValidNormal(
    actualCard: allCard,
    color: color,
    number: possibleNumber
  ): allCard[] {
    const sameByColor = [...filteredWildColor].filter((card) =>
      card.includes(color)
    );
    const sameByNumber = [...filteredWildColor].filter((card) =>
      card.includes(number as unknown as string)
    );

    return [...new Set([...sameByColor, ...sameByNumber])].filter(
      (card) => !card.includes(actualCard)
    );
  },
  GetCardByColor(color: color): allCard[] {
    return [...filteredWildColor].filter((card) => card.includes(color));
  },
};

const reusableGetCardByColor = (color: color) => {
  const filteredCard = filterCardByGivenCard.GetCardByColor(color);

  const idxCard = Math.floor(getRandom() * filteredCard.length);
  const choosenCard = filteredCard[idxCard];

  return choosenCard;
};

enum randomCardCondition {
  randomCard,
  wild,
}

enum givenCardCondition {
  ByGivenCard,
  ByRandomPick,
  ByInitialCard,
}

export class CardPicker {
  static pickRandomCard(): allCard {
    const status: randomCardCondition = randomWithBias(
      [randomCardCondition.randomCard, randomCardCondition.wild],
      [16, 1],
      2
    );

    switch (status) {
      case randomCardCondition.randomCard: {
        const idxReduced = Math.floor(getRandom() * reducedByNumbers.length);
        const reducedNumber = reducedByNumbers[idxReduced];

        const idxCard = Math.floor(
          getRandom() * (cards.length - reducedNumber)
        );
        const card = filteredWildColor[idxCard];

        if (!card) return CardPicker.pickRandomCard();

        return card;
      }

      case randomCardCondition.wild:
        return "wild";
    }
  }

  static getInitialCard() {
    return appropriateInitialCards[
      Math.floor(random() * appropriateInitialCards.length)
    ];
  }

  static pickCardByGivenCard(card: allCard): allCard {
    const status: givenCardCondition = randomWithBias(
      [
        givenCardCondition.ByGivenCard,
        givenCardCondition.ByRandomPick,
        givenCardCondition.ByInitialCard,
      ],
      [13, 5, 1],
      3
    );

    switch (status) {
      case givenCardCondition.ByGivenCard: {
        const state = CardPicker.getCardState(card);

        switch (state.state) {
          case EGetCardState.VALID_NORMAL: {
            const filteredCard = filterCardByGivenCard.ValidNormal(
              card,
              state.color!,
              state.number!
            );

            const idxCard = Math.floor(getRandom() * filteredCard.length);
            const choosenCard = filteredCard[idxCard];

            return choosenCard;
          }

          /* eslint-disable no-fallthrough */

          case EGetCardState.VALID_WILD:
          case EGetCardState.VALID_SPECIAL:
          case EGetCardState.VALID_WILD_PLUS4:
            return reusableGetCardByColor(state.color!);
        }
      }

      case givenCardCondition.ByRandomPick:
        return CardPicker.pickRandomCard();

      case givenCardCondition.ByInitialCard:
        return CardPicker.getInitialCard() as allCard;
    }
  }

  /**
   * Get the state of the current card (normal card, wild card, etc.)
   * @param card Valid given card
   * @returns Object of the card state
   */
  static getCardState(card: allCard): IGetCardState {
    const normalizeCard = card.trim().toLowerCase();

    switch (true) {
      case regexValidNormal.test(normalizeCard): {
        const color = normalizeCard.match(
          regexValidNormal
        )![1] as IGetCardState["color"];
        const number = Number(
          normalizeCard.slice(color!.length)
        )! as IGetCardState["number"];

        return { state: EGetCardState.VALID_NORMAL, color, number };
      }

      case regexValidWildColorPlus4Only.test(normalizeCard): {
        const color = normalizeCard.match(
          regexValidWildColorPlus4Only
        )![2] as IGetCardState["color"];

        return { state: EGetCardState.VALID_WILD_PLUS4, color };
      }

      case regexValidWildColorOnly.test(normalizeCard): {
        const color = normalizeCard.match(
          regexValidWildColorOnly
        )![2] as IGetCardState["color"];

        return {
          state: EGetCardState.VALID_WILD,
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
          state: EGetCardState.VALID_SPECIAL,
          color,
          type,
        };
      }

      default: {
        return { state: EGetCardState.INVALID };
      }
    }
  }
}
