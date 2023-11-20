import { compareMultipleCards } from "../../src/config/cards";
import type { allCard } from "../../src/config/cards";

describe("Multiple Cards | Valid actions tests", () => {
  describe("Multiple same number cards valid actions", () => {
    const multiCards = [
      "blue3",
      "red3",
      "red3",
      "green3",
      "yellow3",
    ] as allCard[];

    it("Match with same base card and first multi cards input", () => {
      const base = "blue8" as allCard;
      const multiCards = ["red8", "green8", "yellow8"] as allCard[];

      const result = compareMultipleCards(base, multiCards);

      expect(result?.state).toBe("VALID_STACK_MOVE");
    });

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

  describe("Multiple special skip cards valid actions", () => {
    const multiCards = [
      "blueskip",
      "redskip",
      "yellowskip",
      "greenskip",
    ] as allCard[];

    it("Must continously stack the same skip card type", () => {
      const base = "blue8" as allCard;

      const result = compareMultipleCards(base, multiCards);

      expect(result?.state).toBe("VALID_SKIP_MOVE");
      expect(result?.count).toBe(4);
    });

    it("Match with wild base card", () => {
      const base = "wildblue" as allCard;

      const result = compareMultipleCards(base, multiCards);

      expect(result?.state).toBe("VALID_SKIP_MOVE");
      expect(result?.count).toBe(4);
    });

    it("Match with wilddraw4 base card", () => {
      const base = "wilddraw4blue" as allCard;

      const result = compareMultipleCards(base, multiCards);

      expect(result?.state).toBe("VALID_SKIP_MOVE");
      expect(result?.count).toBe(4);
    });

    it("Match with reverse base card", () => {
      const base = "bluereverse" as allCard;

      const result = compareMultipleCards(base, multiCards);

      expect(result?.state).toBe("VALID_SKIP_MOVE");
      expect(result?.count).toBe(4);
    });

    it("Match with skip base card", () => {
      const base = "blueskip" as allCard;

      const result = compareMultipleCards(base, multiCards);

      expect(result?.state).toBe("VALID_SKIP_MOVE");
      expect(result?.count).toBe(4);
    });

    it("Match with draw2 base card", () => {
      const base = "bluedraw2" as allCard;

      const result = compareMultipleCards(base, multiCards);

      expect(result?.state).toBe("VALID_SKIP_MOVE");
      expect(result?.count).toBe(4);
    });
  });
});

describe("Multiple Cards | Invalid actions tests", () => {
  describe("Multiple same number cards invalid actions", () => {
    it("Must continously same normal card not special card", () => {
      const base = "blue1" as allCard;
      const multiCards = ["blue4", "wildred"] as allCard[];

      const result = compareMultipleCards(base, multiCards);

      expect(result?.state).toBe("INVALID");
    });

    it("Must continously same number", () => {
      const base = "blue1" as allCard;
      const multiCards = ["blue4", "red4", "green2"] as allCard[];

      const result = compareMultipleCards(base, multiCards);

      expect(result?.state).toBe("INVALID");
    });
  });

  describe("Multiple special skip cards invalid actions", () => {
    it("First card must match base color", () => {
      const base = "red5" as allCard;
      const multiCards = [
        "blueskip",
        "redskip",
        "yellowskip",
        "greenskip",
      ] as allCard[];

      const result = compareMultipleCards(base, multiCards);

      expect(result?.state).toBe("INVALID");
    });
  });
});
