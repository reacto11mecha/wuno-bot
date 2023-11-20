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
  it("Apapun yang nomornya sama di deck dan sama dengan semua kartu yang ingin di stack", () => {
    const base = "bluedraw2" as allCard;
    const multiCards = [
      "blue3",
      "red3",
      "red3",
      "green3",
      "yellow3",
    ] as allCard[];

    const result = compareMultipleCards(base, multiCards);

    expect(result?.state).toBe("VALID_STACK_MOVE");
  });
});
