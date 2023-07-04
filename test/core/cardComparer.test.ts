import { compareTwoCard } from "../../src/config/cards";
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

describe("Card comparer unit test [STACK | STACK WILD | STACK SPECIAL]", () => {
  test.each(
    // Create an array of firstCard
    // and secondCard with same color
    allColor.flatMap((colorItem) =>
      allValidNumbers.flatMap((numberItem) => {
        const firstCard = `${colorItem.color}${numberItem.number}`;
        const secondCard = allValidNumbers.map(
          (secondNumberItem) => `${colorItem.color}${secondNumberItem.number}`
        );

        return secondCard.map((sc) => ({ firstCard, secondCard: sc }));
      })
    )
  )(
    "Should be succesfully stack $firstCard and $secondCard because it has same color",
    ({ firstCard, secondCard }) => {
      const status = compareTwoCard(
        firstCard as allCard,
        secondCard as allCard
      );

      expect(status).toBe("STACK");
    }
  );

  test.each(
    // Create an array of firstCard and secondCard
    // with different color but with the same number
    allValidNumbers.flatMap(({ number }) =>
      allColor.map(({ color }) => ({
        firstCard: `${color}${number}`,
        secondCard: `${color}${number}`,
      }))
    )
  )(
    "Should be succesfully stack $firstCard and $secondCard because it has same number",
    ({ firstCard, secondCard }) => {
      const status = compareTwoCard(
        firstCard as allCard,
        secondCard as allCard
      );

      expect(status).toBe("STACK");
    }
  );

  describe.each(
    allColor.map(({ color }) => ({ wildPlus4: `wilddraw4${color}` }))
  )("Test if $wildPlus4 could stack on normal color", ({ wildPlus4 }) => {
    test.each(
      allValidNumbers.flatMap(({ number }) =>
        allColor.flatMap(({ color }) => ({
          card: `${color}${number}`,
        }))
      )
    )("Plus 4 card could stack on normal color ($card)", ({ card }) => {
      const status = compareTwoCard(card as allCard, wildPlus4 as allCard);

      expect(status).toBe("STACK_PLUS_4");
    });
  });

  // it("Stack wild whatever the normal color is", () => {
  //   const colorWNumber = allColor.map((color) => `${color}1` as allCard);
  //   const WildWithColor = allColor.map((color) => `wild${color}` as allCard);
  //
  //   const allPossibleCombination = colorWNumber
  //     .map((card) =>
  //       WildWithColor.map((wildCard) => compareTwoCard(card, wildCard))
  //     )
  //     .reduce((curr, acc) => curr.concat(acc));
  //
  //   expect(allPossibleCombination.length).toEqual(16);
  //   expect(
  //     allPossibleCombination.every(
  //       (combination) => combination === "STACK_WILD"
  //     )
  //   ).toBe(true);
  // });
  //
  // it("Stack special card if the card is the same color as the deck card color", () => {
  //   const allPossibleCombination = allSpecialCard
  //     .map((type) =>
  //       allColor.map((card) => {
  //         const normalColor = `${card}8` as allCard;
  //         const specialColor = `${card}${type}` as allCard;
  //
  //         return compareTwoCard(normalColor, specialColor);
  //       })
  //     )
  //     .reduce((curr, acc) => curr.concat(acc));
  //
  //   expect(allPossibleCombination.length).toEqual(12);
  //   expect(
  //     allSpecialCard
  //       .map((special) => `VALID_SPECIAL_${special.toUpperCase()}`)
  //       .map((type) =>
  //         allPossibleCombination.some((combination) => combination === type)
  //       )
  //       .every((combinationType) => combinationType === true)
  //   ).toBe(true);
  // });
  //
  // it("Stack special color with the same special type but different color", () => {
  //   const allPossibleCombination = allColor
  //     .map((color) =>
  //       allColor
  //         .filter((type) => type !== color)
  //         .map((opposite) =>
  //           allSpecialCard.map((special) => {
  //             const deckCard = `${opposite}${special}` as allCard;
  //             const givenCard = `${color}${special}` as allCard;
  //
  //             return compareTwoCard(deckCard, givenCard);
  //           })
  //         )
  //     )
  //     .flat(2);
  //
  //   expect(allPossibleCombination.length).toEqual(36);
  //   expect(
  //     allSpecialCard
  //       .map((special) => `VALID_SPECIAL_${special.toUpperCase()}`)
  //       .map((type) =>
  //         allPossibleCombination.some((combination) => combination === type)
  //       )
  //       .every((combinationType) => combinationType === true)
  //   ).toBe(true);
  // });
  //
  // it("Stack card if the color is the same as wild color in the deck", () => {
  //   const colorWNumber = allColor.map((color) => `${color}2` as allCard);
  //
  //   const allPossibleCombination = colorWNumber.map((card) => {
  //     const normalColor = `${card}2` as allCard;
  //     const wildColor = `wild${card}` as allCard;
  //
  //     return compareTwoCard(wildColor, normalColor);
  //   });
  //
  //   expect(allPossibleCombination.length).toEqual(4);
  //   expect(
  //     allPossibleCombination.every((combination) => combination === "STACK")
  //   ).toBe(true);
  // });
  //
  // it("Stack card if the color is the same as wilddraw4 color in the deck", () => {
  //   const colorWNumber = allColor.map((color) => `${color}3` as allCard);
  //
  //   const allPossibleCombination = colorWNumber.map((card) => {
  //     const normalColor = `${card}2` as allCard;
  //     const wildPlus4Color = `wilddraw4${card}` as allCard;
  //
  //     return compareTwoCard(wildPlus4Color, normalColor);
  //   });
  //
  //   expect(allPossibleCombination.length).toEqual(4);
  //   expect(
  //     allPossibleCombination.every((combination) => combination === "STACK")
  //   ).toBe(true);
  // });
});

describe("Card comparer unit test [UNMATCH]", () => {
  // it("Normal card compared to normal card but all card are unmatch", () => {
  //   const allPossibleCombination = allColor
  //     .map((type) =>
  //       allColor
  //         .filter((color) => color !== type)
  //         .map((opposite) => {
  //           const deckCard = `${type}4` as allCard;
  //           const givenCard = `${opposite}5` as allCard;
  //
  //           return compareTwoCard(deckCard, givenCard);
  //         })
  //     )
  //     .flat();
  //
  //   expect(allPossibleCombination.length).toEqual(12);
  //   expect(
  //     allPossibleCombination.every((combination) => combination === "UNMATCH")
  //   ).toBe(true);
  // });
  //
  // it("Stack plus 4 compared to normal card but all card are unmatch", () => {
  //   const allPossibleCombination = allColor
  //     .map((type) =>
  //       allColor
  //         .filter((color) => color !== type)
  //         .map((opposite) => {
  //           const deckCard = `wildddraw4${type}` as allCard;
  //           const givenCard = `${opposite}4` as allCard;
  //
  //           return compareTwoCard(deckCard, givenCard);
  //         })
  //     )
  //     .reduce((curr, acc) => curr.concat(acc));
  //
  //   expect(allPossibleCombination.length).toEqual(12);
  //   expect(
  //     allPossibleCombination.every((combination) => combination === "UNMATCH")
  //   ).toBe(true);
  // });
  //
  // it("Stack wild compared to normal card but all card are unmatch", () => {
  //   const allPossibleCombination = allColor
  //     .map((type) =>
  //       allColor
  //         .filter((color) => color !== type)
  //         .map((opposite) => {
  //           const deckCard = `wild${opposite}` as allCard;
  //           const givenCard = `${type}4` as allCard;
  //
  //           return compareTwoCard(deckCard, givenCard);
  //         })
  //     )
  //     .reduce((curr, acc) => curr.concat(acc));
  //
  //   expect(allPossibleCombination.length).toEqual(12);
  //   expect(
  //     allPossibleCombination.every((combination) => combination === "UNMATCH")
  //   ).toBe(true);
  // });
  //
  // it("Stack special compared to special card but all card are unmatch", () => {
  //   const allPossibleCombination = allSpecialCard
  //     .map((special) =>
  //       allSpecialCard
  //         .filter((type) => type !== special)
  //         .map((oppositeType) =>
  //           allColor.map((color) =>
  //             allColor
  //               .filter((type) => type !== color)
  //               .map((oppositeColor) => {
  //                 const deckCard = `${oppositeColor}${oppositeType}` as allCard;
  //                 const givenCard = `${color}${special}` as allCard;
  //
  //                 return compareTwoCard(deckCard, givenCard);
  //               })
  //           )
  //         )
  //     )
  //     .map((data) => data.reduce((curr, acc) => curr.concat(acc)))
  //     .map((data) => data.reduce((curr, acc) => curr.concat(acc)))
  //     .reduce((curr, acc) => curr.concat(acc));
  //
  //   expect(allPossibleCombination.length).toEqual(72);
  //   expect(
  //     allPossibleCombination.every((combination) => combination === "UNMATCH")
  //   ).toBe(true);
  // });
});
