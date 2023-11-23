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

    it("Match with wild same color base card", () => {
      const base = "wildblue" as allCard;

      const result = compareMultipleCards(base, multiCards);

      expect(result?.state).toBe("VALID_SKIP_MOVE");
      expect(result?.count).toBe(4);
    });

    it("Match with wilddraw4 same color base card", () => {
      const base = "wilddraw4blue" as allCard;

      const result = compareMultipleCards(base, multiCards);

      expect(result?.state).toBe("VALID_SKIP_MOVE");
      expect(result?.count).toBe(4);
    });

    it("Match with reverse same color base card", () => {
      const base = "bluereverse" as allCard;

      const result = compareMultipleCards(base, multiCards);

      expect(result?.state).toBe("VALID_SKIP_MOVE");
      expect(result?.count).toBe(4);
    });

    it("Match with skip same color base card", () => {
      const base = "blueskip" as allCard;

      const result = compareMultipleCards(base, multiCards);

      expect(result?.state).toBe("VALID_SKIP_MOVE");
      expect(result?.count).toBe(4);
    });

    it("Match with draw2 same color base card", () => {
      const base = "bluedraw2" as allCard;

      const result = compareMultipleCards(base, multiCards);

      expect(result?.state).toBe("VALID_SKIP_MOVE");
      expect(result?.count).toBe(4);
    });
  });

  describe("Multiple special reverse cards valid actions", () => {
    const multiCards = [
      "greenreverse",
      "bluereverse",
      "redreverse",
      "yellowreverse",
    ] as allCard[];

    it("Must continously stack the same reverse card type", () => {
      const base = "green5" as allCard;

      const result = compareMultipleCards(base, multiCards);

      expect(result?.state).toBe("VALID_REVERSE_MOVE");
      expect(result?.count).toBe(4);
    });

    it("Match with wild same color base card", () => {
      const base = "wildgreen" as allCard;

      const result = compareMultipleCards(base, multiCards);

      expect(result?.state).toBe("VALID_REVERSE_MOVE");
      expect(result?.count).toBe(4);
    });

    it("Match with wilddraw4 same color base card", () => {
      const base = "wilddraw4green" as allCard;

      const result = compareMultipleCards(base, multiCards);

      expect(result?.state).toBe("VALID_REVERSE_MOVE");
      expect(result?.count).toBe(4);
    });

    it("Match with reverse same color base card", () => {
      const base = "greenreverse" as allCard;

      const result = compareMultipleCards(base, multiCards);

      expect(result?.state).toBe("VALID_REVERSE_MOVE");
      expect(result?.count).toBe(4);
    });

    it("Match with skip same color base card", () => {
      const base = "greenskip" as allCard;

      const result = compareMultipleCards(base, multiCards);

      expect(result?.state).toBe("VALID_REVERSE_MOVE");
      expect(result?.count).toBe(4);
    });

    it("Match with draw2 same color base card", () => {
      const base = "greendraw2" as allCard;

      const result = compareMultipleCards(base, multiCards);

      expect(result?.state).toBe("VALID_REVERSE_MOVE");
      expect(result?.count).toBe(4);
    });
  });

  describe("Multiple special draw2 cards valid actions", () => {
    it("", () => {});
  });
});

describe("Multiple Cards | Invalid actions tests", () => {
  describe("Multiple same number cards invalid actions", () => {
    it("First card must match base color", () => {
      const base = "green5" as allCard;
      const multiCards = ["blue3", "red3", "yellow3", "green3"] as allCard[];

      const result = compareMultipleCards(base, multiCards);

      expect(result?.state).toBe("INVALID");
    });

    it("Must continously same normal card and not special card", () => {
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

    it("Must continously stack the skip cards", () => {
      const base = "red5" as allCard;
      const multiCards = [
        "blueskip",
        "redskip",
        "yellowskip",
        "yellow2",
      ] as allCard[];

      const result = compareMultipleCards(base, multiCards);

      expect(result?.state).toBe("INVALID");
    });
  });

  describe("Multiple special reverse cards valid actions", () => {
    it("First card must match base color", () => {
      const base = "green8" as allCard;
      const multiCards = [
        "yellowreverse",
        "redreverse",
        "bluereverse",
        "greenreverse",
      ] as allCard[];

      const result = compareMultipleCards(base, multiCards);

      expect(result?.state).toBe("INVALID");
    });

    it("Must continously stack reverse cards", () => {
      const base = "yellow8" as allCard;
      const multiCards = [
        "yellowreverse",
        "greenreverse",
        "bluereverse",
        "blue1",
      ] as allCard[];

      const result = compareMultipleCards(base, multiCards);

      expect(result?.state).toBe("INVALID");
    });
  });
});
