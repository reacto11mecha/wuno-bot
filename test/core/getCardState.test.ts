import { CardPicker, EGetCardState } from "../../src/config/cards";
import type { allCard } from "../../src/config/cards";

const allColor = [
  { color: "red" },
  { color: "green" },
  { color: "blue" },
  { color: "yellow" },
];
const allSpecialCard = [
  { type: "reverse" },
  { type: "skip" },
  { type: "draw2" },
];
const allValidNumbers = Array.from({ length: 10 }).map((_, number) => ({
  number,
}));

describe("Get card state unit test", () => {
  it("Function should return invalid state", () => {
    const { state } = CardPicker.getCardState("definitelynotacard" as allCard);

    expect(state).toBe(EGetCardState.INVALID);
  });

  describe.each(allColor)(
    "Check normal number card with $color color is VALID_NORMAL",
    ({ color }) => {
      test.each(allValidNumbers)(
        `The card ${color}$number should be a VALID_NORMAL`,
        ({ number }) => {
          const cardState = CardPicker.getCardState(
            `${color}${number}` as allCard
          );

          expect(cardState.state).toBe(EGetCardState.VALID_NORMAL);
        }
      );
    }
  );

  describe.each(allColor)(
    "Check plus 4 card with specific $color color is VALID_WILD_PLUS4",
    ({ color }) => {
      it(`Card wilddraw4${color} is VALID_WILD`, () => {
        const cardState = CardPicker.getCardState(
          `wilddraw4${color}` as allCard
        );

        expect(cardState.state).toBe(EGetCardState.VALID_WILD_PLUS4);
      });
    }
  );

  describe.each(allColor)(
    "Check wild card with $color color is VALID_WILD",
    ({ color }) => {
      it(`Card wild${color} is VALID_WILD`, () => {
        const cardState = CardPicker.getCardState(`wild${color}` as allCard);

        expect(cardState.state).toBe(EGetCardState.VALID_WILD);
      });
    }
  );

  describe.each(allColor)(
    "Check special card with $color color is special card according to type",
    ({ color }) => {
      test.each(allSpecialCard)(
        `Check if the ${color}$type card is valid special and in the $type type`,
        ({ type }) => {
          const cardState = CardPicker.getCardState(
            `${color}${type}` as allCard
          );

          expect(cardState.state).toBe(EGetCardState.VALID_SPECIAL);
          expect(cardState.type).toBe(type);
        }
      );
    }
  );
});
