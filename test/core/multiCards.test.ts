import { compareMultipleCards } from "../../src/config/cards";
import type { allCard } from "../../src/config/cards";

// const allColor = [
//   { color: "red" },
//   { color: "green" },
//   { color: "blue" },
//   { color: "yellow" },
// ];
// const allSpecialCard = [
//   { type: "reverse" },
//   { type: "skip" },
//   { type: "draw2" },
// ];
// const allValidNumbers = Array.from({ length: 10 }).map((_, number) => ({
//   number,
// }));
//
// const allNormalColor = allValidNumbers.flatMap(({ number }) =>
//   allColor.flatMap(({ color }) => ({
//     card: `${color}${number}` as allCard,
//   })),
// );

describe("Multiple Cards | Valid actions tests", () => {
  describe("Multiple same number cards", () => {
    const multiCards = [
      "blue3",
      "red3",
      "red3",
      "green3",
      "yellow3",
    ] as allCard[];

    it("Match with normal color base card", () => {
      const base = "blue1" as allCard;

      const result = compareMultipleCards(base, multiCards);

      expect(result?.state).toBe("VALID_STACK_MOVE");
    });

    it("Match with wild base card", () => {
      const base = "wildblue" as allCard;

      const result = compareMultipleCards(base, multiCards);

      expect(result?.state).toBe("VALID_STACK_MOVE");
    });

    it("Match with wilddraw4 base card", () => {
      const base = "wilddraw4blue" as allCard;

      const result = compareMultipleCards(base, multiCards);

      expect(result?.state).toBe("VALID_STACK_MOVE");
    });

    it("Match with reverse base card", () => {
      const base = "bluereverse" as allCard;

      const result = compareMultipleCards(base, multiCards);

      expect(result?.state).toBe("VALID_STACK_MOVE");
    });

    it("Match with skip base card", () => {
      const base = "blueskip" as allCard;

      const result = compareMultipleCards(base, multiCards);

      expect(result?.state).toBe("VALID_STACK_MOVE");
    });

    it("Match with draw2 base card", () => {
      const base = "bluedraw2" as allCard;

      const result = compareMultipleCards(base, multiCards);

      expect(result?.state).toBe("VALID_STACK_MOVE");
    });
  });
});
