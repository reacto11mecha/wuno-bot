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

export class filterCardByGivenCard {
  static ValidNormal(
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
  }

  static GetCardByColor(color: color): allCard[] {
    return [...filteredWildColor].filter((card) => card.includes(color));
  }
}

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
  /**
   * Pick a random card or wild card in ratio 16:1
   * @returns Defined random card or wild card in ratio 16:1
   */
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

  /**
   * Pick any card that appropriate as normal card
   * @returns Appropriate initial card
   */
  static getInitialCard() {
    return appropriateInitialCards[
      Math.floor(random() * appropriateInitialCards.length)
    ];
  }

  /**
   * Card picker by given card
   * @param card A valid UNO card
   * @returns Biased card by given card, random card, or initial card in ratio 13:5:1
   */
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

/**
 * A function that used to defining the state for switch case comparer
 * @param firstState Card state from the deck
 * @param secState Card state from the user given card
 * @returns An objects that indicate a certain valid condition
 */
export const getSwitchState = (
  firstState: IGetCardState,
  secState: IGetCardState
) => {
  /**
   * If the color or number is the same, but it's not special or plus4 card
   */
  const FIRSTCARD_IS_COLOR_OR_NUMBER_IS_SAME =
    (firstState?.color === secState?.color ||
      firstState?.number === secState?.number) &&
    secState.state !== EGetCardState.VALID_SPECIAL;

  /**
   * If the first card is the wild and the color of second card is the same
   * or the first card is the plus4 and the color of second card is the same
   */
  const FIRSTCARD_IS_WILD_OR_WILD4_IS_SAME_SECOND_COLOR =
    (firstState.state === EGetCardState.VALID_WILD &&
      firstState.color === secState.color) ||
    (firstState.state === EGetCardState.VALID_WILD_PLUS4 &&
      firstState.color === secState.color);

  /**
   * If the second card is special card and the color
   * of the second card is the same as the first card color
   */
  const SECONDCARD_IS_VALIDSPECIAL_AND_SAME_COLOR_AS_FIRSTCARD =
    secState.state === EGetCardState.VALID_SPECIAL &&
    secState.color === firstState.color;

  /**
   * If the first card is special card and the type of
   * the second card is the same as the first card type
   */
  const FIRSTCARD_IS_NTYPE_AND_SECONDCARD_IS_NTYPE_TOO =
    firstState.state === EGetCardState.VALID_SPECIAL &&
    secState.state === EGetCardState.VALID_SPECIAL &&
    firstState.type === secState.type;

  /**
   * If the second card is wild card or in the other word is color only
   */
  const SECONDCARD_IS_WILD = secState.state === EGetCardState.VALID_WILD;

  /**
   * If the second card is plus4 card
   */
  const SECONDCARD_IS_WILD4 = secState.state === EGetCardState.VALID_WILD_PLUS4;

  return {
    FIRSTCARD_IS_COLOR_OR_NUMBER_IS_SAME,
    FIRSTCARD_IS_WILD_OR_WILD4_IS_SAME_SECOND_COLOR,
    SECONDCARD_IS_VALIDSPECIAL_AND_SAME_COLOR_AS_FIRSTCARD,
    FIRSTCARD_IS_NTYPE_AND_SECONDCARD_IS_NTYPE_TOO,
    SECONDCARD_IS_WILD,
    SECONDCARD_IS_WILD4,
  };
};

/**
 * Card comparer for the main logic of the bot
 * @param firstCard The card from the deck
 * @param secCard The user given card
 * @returns String that indicate is valid or not
 */
export const compareTwoCard = (firstCard: allCard, secCard: allCard) => {
  const firstState = CardPicker.getCardState(firstCard);
  const secState = CardPicker.getCardState(secCard);

  const switchState = getSwitchState(firstState, secState);

  switch (true) {
    /* eslint-disable no-fallthrough */

    // Valid wilddraw4 from player
    case switchState.SECONDCARD_IS_WILD4:
      return "STACK_PLUS_4";

    // Valid wild color only from player
    case switchState.SECONDCARD_IS_WILD:
      return "STACK_WILD";

    case switchState.FIRSTCARD_IS_COLOR_OR_NUMBER_IS_SAME:
    case switchState.FIRSTCARD_IS_WILD_OR_WILD4_IS_SAME_SECOND_COLOR:
      return "STACK";

    case switchState.FIRSTCARD_IS_NTYPE_AND_SECONDCARD_IS_NTYPE_TOO:
    case switchState.SECONDCARD_IS_VALIDSPECIAL_AND_SAME_COLOR_AS_FIRSTCARD:
      return `VALID_SPECIAL_${secState.type!.toUpperCase()}`;

    default:
      return "UNMATCH";
  }
};
