import { random, weightedRandom } from "../utils";

/**
 * Typing for all possible UNO card color
 */
export type color = "red" | "green" | "blue" | "yellow";

/**
 * Typing for all possible UNO card number
 */
export type possibleNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/**
 * Typing for all possible UNO card
 */
export type allCard =
  | `${color}${possibleNumber}`
  | `wild${color}`
  | `wilddraw4${color}`
  | `${color}reverse`
  | `${color}skip`
  | `${color}draw2`
  | "wild"
  | "wilddraw4";

/**
 * Enum for single state card
 */
export const EGetCardState = {
  VALID_NORMAL: "VALID_NORMAL",
  VALID_WILD_PLUS4: "VALID_WILD_PLUS4",
  VALID_WILD: "VALID_WILD",
  VALID_SPECIAL: "VALID_SPECIAL",
  INVALID: "INVALID",
} as const;

/**
 * Typing for EGetCardState enum
 */
export type EGetCardStateType = keyof typeof EGetCardState;

/**
 * Interface for return type of "getCardState" function
 */
export interface IGetCardState {
  state: EGetCardStateType;
  color?: color;
  number?: possibleNumber;
  type?: "draw2" | "reverse" | "skip";
}

/**
 * List of all available cards
 */
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

const reducedByNumbers = Array.from({ length: 14 }).map((_, idx) => idx);
const filteredWildColor = cards
  .filter((card) => !regexValidWildColorOnly.test(card))
  .filter((card) => !regexValidWildColorPlus4Only.test(card));
const appropriateInitialCards = cards
  .filter((e) => !e.startsWith("wild"))
  .filter((e) => !e.endsWith("skip"))
  .filter((e) => !e.endsWith("draw2"))
  .filter((e) => !e.endsWith("reverse"));

/**
 * Class that have contains collection for static function
 */
export class filterCardByGivenCard {
  static ValidNormal(
    actualCard: allCard,
    color: color,
    number: possibleNumber,
  ): allCard[] {
    const sameByColor = [...filteredWildColor]
      .filter((card) => card.includes(color))
      .filter((card) => !card.includes("draw2"))
      .filter((card) => !card.includes("reverse"))
      .filter((card) => !card.includes("skip"));

    const sameByNumber = [...filteredWildColor]
      .filter((card) => card.includes(number as unknown as string))
      .filter((card) => !card.includes("draw2"))
      .filter((card) => !card.includes("reverse"))
      .filter((card) => !card.includes("skip"));

    return [...new Set([...sameByColor, ...sameByNumber])].filter(
      (card) => !card.includes(actualCard),
    );
  }

  static GetCardByColor(color: color): allCard[] {
    return [...filteredWildColor].filter((card) => card.includes(color));
  }
}

const reusableGetCardByColor = (color: color) => {
  const filteredCard = filterCardByGivenCard.GetCardByColor(color);

  const idxCard = Math.floor(random() * filteredCard.length);
  const choosenCard = filteredCard[idxCard];

  return choosenCard;
};

enum givenCardCondition {
  ByGivenCard,
  ByMagicCard,
  ByRandomPick,
}

/**
 * Class that contains static function for picking card stuff
 */
export class CardPicker {
  /**
   * Pick a straight up random card
   * @returns A random card that doesn't biased by anything
   */
  static pickRandomCard(): allCard {
    const idxReduced = Math.floor(random() * reducedByNumbers.length);
    const reducedNumber = reducedByNumbers[idxReduced];

    const idxCard = Math.floor(random() * (cards.length - reducedNumber));
    const card = filteredWildColor[idxCard];

    if (!card) return CardPicker.pickRandomCard();

    return card;
  }

  static pickByMagicCardBasedOnColor(color: color) {
    const cards = [
      `${color}draw2`,
      `${color}reverse`,
      `${color}skip`,
      "wild",
      "wilddraw4",
    ] as allCard[];

    const idxCard = Math.floor(random() * cards.length);
    const card = cards[idxCard];

    if (!card) return CardPicker.pickRandomCard();

    return card;
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
    const status = weightedRandom<givenCardCondition>(
      [
        givenCardCondition.ByGivenCard,
        givenCardCondition.ByMagicCard,
        givenCardCondition.ByRandomPick,
      ],
      [50, 20, 10],
    );

    switch (status) {
      case givenCardCondition.ByGivenCard: {
        const state = CardPicker.getCardState(card);

        switch (state.state) {
          case EGetCardState.VALID_NORMAL: {
            const filteredCard = filterCardByGivenCard.ValidNormal(
              card,
              state.color!,
              state.number!,
            );

            const idxCard = Math.floor(random() * filteredCard.length);
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

      case givenCardCondition.ByMagicCard: {
        const state = CardPicker.getCardState(card);

        return CardPicker.pickByMagicCardBasedOnColor(state.color!);
      }

      case givenCardCondition.ByRandomPick:
      default:
        return CardPicker.pickRandomCard();
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
          regexValidNormal,
        )![1] as IGetCardState["color"];
        const number = Number(
          normalizeCard.slice(color!.length),
        )! as IGetCardState["number"];

        return { state: EGetCardState.VALID_NORMAL, color, number };
      }

      case regexValidWildColorPlus4Only.test(normalizeCard): {
        const color = normalizeCard.match(
          regexValidWildColorPlus4Only,
        )![2] as IGetCardState["color"];

        return { state: EGetCardState.VALID_WILD_PLUS4, color };
      }

      case regexValidWildColorOnly.test(normalizeCard): {
        const color = normalizeCard.match(
          regexValidWildColorOnly,
        )![2] as IGetCardState["color"];

        return {
          state: EGetCardState.VALID_WILD,
          color,
        };
      }

      case regexValidSpecial.test(normalizeCard): {
        const color = normalizeCard.match(
          regexValidSpecial,
        )![1]! as IGetCardState["color"];
        const type = normalizeCard.match(
          regexValidSpecial,
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
 * Enum that used for "getSwitchState" function
 */
export const switchState = {
  FIRSTCARD_IS_COLOR_OR_NUMBER_IS_SAME: "FIRSTCARD_IS_COLOR_OR_NUMBER_IS_SAME",
  FIRSTCARD_IS_WILD_OR_WILD4_IS_SAME_SECOND_COLOR:
    "FIRSTCARD_IS_WILD_OR_WILD4_IS_SAME_SECOND_COLOR",
  SECONDCARD_IS_VALIDSPECIAL_AND_SAME_COLOR_AS_FIRSTCARD:
    "SECONDCARD_IS_VALIDSPECIAL_AND_SAME_COLOR_AS_FIRSTCARD",
  FIRSTCARD_IS_NTYPE_AND_SECONDCARD_IS_NTYPE_TOO:
    "FIRSTCARD_IS_NTYPE_AND_SECONDCARD_IS_NTYPE_TOO",
  SECONDCARD_IS_WILD: "SECONDCARD_IS_WILD",
  SECONDCARD_IS_WILD4: "SECONDCARD_IS_WILD4",
} as const;

/**
 * A function that used to defining the state for switch case comparer
 * @param firstState Card state from the deck
 * @param secState Card state from the user given card
 * @returns An enum that indicate a certain valid condition
 */
export const getSwitchState = (
  firstState: IGetCardState,
  secState: IGetCardState,
) => {
  if (secState.state === EGetCardState.VALID_WILD)
    return switchState.SECONDCARD_IS_WILD;
  else if (secState.state === EGetCardState.VALID_WILD_PLUS4)
    return switchState.SECONDCARD_IS_WILD4;
  else if (
    (firstState?.color === secState?.color ||
      firstState?.number === secState?.number) &&
    secState.state !== EGetCardState.VALID_SPECIAL
  )
    return switchState.FIRSTCARD_IS_COLOR_OR_NUMBER_IS_SAME;
  else if (
    (firstState.state === EGetCardState.VALID_WILD ||
      firstState.state === EGetCardState.VALID_WILD_PLUS4) &&
    firstState.color === secState.color &&
    !secState.type
  )
    return switchState.FIRSTCARD_IS_WILD_OR_WILD4_IS_SAME_SECOND_COLOR;
  else if (
    secState.state === EGetCardState.VALID_SPECIAL &&
    secState.color === firstState.color
  )
    return switchState.SECONDCARD_IS_VALIDSPECIAL_AND_SAME_COLOR_AS_FIRSTCARD;
  else if (
    firstState.state === EGetCardState.VALID_SPECIAL &&
    secState.state === EGetCardState.VALID_SPECIAL &&
    firstState.type === secState.type
  )
    return switchState.FIRSTCARD_IS_NTYPE_AND_SECONDCARD_IS_NTYPE_TOO;
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

  const switchStateCard = getSwitchState(firstState, secState);

  switch (switchStateCard) {
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

export interface IMultiCards {
  state:
    | "VALID_PLUS_MOVE"
    | "VALID_REVERSE_MOVE"
    | "VALID_SKIP_MOVE"
    | "VALID_STACK_MOVE"
    | "INVALID";
  count?: number;
}

export const compareMultipleCards = (
  baseCard: allCard,
  inputCards: allCard[],
): IMultiCards => {
  const firstCard = inputCards[0];

  const baseCardState = CardPicker.getCardState(baseCard);
  const firstCardState = CardPicker.getCardState(firstCard);

  const stateCardFirst = compareTwoCard(baseCard, firstCard);

  if (stateCardFirst === "UNMATCH")
    return {
      state: "INVALID",
    };

  if (firstCardState.state === "VALID_WILD_PLUS4") {
    // if (true)
    return {
      state: "VALID_PLUS_MOVE",
    };

    // return {
    //   state: "INVALID"
    // }
  } else if (
    firstCardState.state === "VALID_SPECIAL" &&
    firstCardState.type === "draw2" &&
    firstCardState.color === baseCardState.color
  ) {
    // if(true)
    return {
      state: "VALID_PLUS_MOVE",
    };

    // return {
    //   state: "INVALID"
    // }
  } else if (
    firstCardState.state === "VALID_SPECIAL" &&
    firstCardState.type === "reverse" &&
    firstCardState.color === baseCardState.color
  ) {
    const sameReverseTypesForEveryCard = inputCards
      .map((card) => CardPicker.getCardState(card))
      .every(
        (card) => card.state === "VALID_SPECIAL" && card.type === "reverse",
      );

    if (sameReverseTypesForEveryCard)
      return {
        state: "VALID_REVERSE_MOVE",
        count: inputCards.length,
      };

    return {
      state: "INVALID",
    };
  } else if (
    firstCardState.state === "VALID_SPECIAL" &&
    firstCardState.type === "skip" &&
    firstCardState.color === baseCardState.color
  ) {
    const sameSkipTypesForEveryCard = inputCards
      .map((card) => CardPicker.getCardState(card))
      .every((card) => card.state === "VALID_SPECIAL" && card.type === "skip");

    if (sameSkipTypesForEveryCard)
      return {
        state: "VALID_SKIP_MOVE",
        count: inputCards.length,
      };

    return {
      state: "INVALID",
    };
  } else if (
    (firstCardState.state === "VALID_NORMAL" &&
      baseCardState.color === firstCardState.color) ||
    (firstCardState.state === "VALID_NORMAL" &&
      baseCardState.number === firstCardState.number)
  ) {
    const sameNumberForEveryCard = inputCards
      .map((card) => CardPicker.getCardState(card))
      .every((card) => card.number === firstCardState.number);

    if (sameNumberForEveryCard)
      return {
        state: "VALID_STACK_MOVE",
      };

    return {
      state: "INVALID",
    };
  }

  return {
    state: "INVALID",
  };
};
