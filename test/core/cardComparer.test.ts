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

const allNormalColor = allValidNumbers.flatMap(({ number }) =>
  allColor.flatMap(({ color }) => ({
    card: `${color}${number}`,
  }))
);

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

  // Stack all card with the same color
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

  // Stack wild plus 4 to the deck
  describe.each(
    // Create wilddraw4 with all color
    allColor.map(({ color }) => ({ wildPlus4: `wilddraw4${color}` }))
  )("Test if plus 4 card could stack on normal color", ({ wildPlus4 }) => {
    test.each(allNormalColor)(
      "Plus 4 card could stack on normal color ($card)",
      ({ card }) => {
        const status = compareTwoCard(card as allCard, wildPlus4 as allCard);

        expect(status).toBe("STACK_PLUS_4");
      }
    );
  });

  // The plus 4 is already on the deck, player will stack their card
  describe.each(
    // Create wilddraw4 card with all color
    allColor.map(({ color }) => ({ wildDraw4: `wilddraw4${color}`, color }))
  )(
    "Test if normal coloured card can stack normally on specific wilddraw4 on the deck",
    ({ wildDraw4, color }) => {
      test.each(allNormalColor.filter(({ card }) => card.includes(color)))(
        `$card could be stacked on ${wildDraw4}`,
        ({ card }) => {
          const status = compareTwoCard(wildDraw4 as allCard, card as allCard);

          expect(status).toBe("STACK");
        }
      );
    }
  );

  // Stack wild color to the deck, it'll bypass all normal coloured card
  describe.each(
    // Create wild card with all color
    allColor.map(({ color }) => ({ wild: `wild${color}` }))
  )("Test if wild card can bypass all normal coloured card", ({ wild }) => {
    test.each(allNormalColor)(
      `${wild} card could stack on normal color ($card)`,
      ({ card }) => {
        const status = compareTwoCard(card as allCard, wild as allCard);

        expect(status).toBe("STACK_WILD");
      }
    );
  });

  // Specific coloured wild card already on the deck,
  // player want to stack the card with normal card
  describe.each(
    // Create wild card with all color
    allColor.map(({ color }) => ({ wild: `wild${color}`, color }))
  )(
    "Test if normal coloured card can stack normally on specific wild on the deck",
    ({ wild, color }) => {
      test.each(allNormalColor.filter(({ card }) => card.includes(color)))(
        `$card could be stacked on ${wild}`,
        ({ card }) => {
          const status = compareTwoCard(wild as allCard, card as allCard);

          expect(status).toBe("STACK");
        }
      );
    }
  );

  // Stack skip card to the deck
  describe.each(
    // Create all skip card with specific color
    allColor.map(({ color }) => ({ skipCard: `${color}skip`, color }))
  )("Test all skip card with same card color", ({ skipCard, color }) => {
    test.each(allNormalColor.filter(({ card }) => card.includes(color)))(
      `${skipCard} could be stacked on $card because they are the same by card color`,
      ({ card }) => {
        const status = compareTwoCard(card as allCard, skipCard as allCard);

        expect(status).toBe("VALID_SPECIAL_SKIP");
      }
    );
  });

  // Stack reverse card to the deck
  describe.each(
    // Create all reverse card with specific color
    allColor.map(({ color }) => ({ reverseCard: `${color}reverse`, color }))
  )("Test all reverse card with same card color", ({ reverseCard, color }) => {
    test.each(allNormalColor.filter(({ card }) => card.includes(color)))(
      `${reverseCard} could be stacked on $card because they are the same by card color`,
      ({ card }) => {
        const status = compareTwoCard(card as allCard, reverseCard as allCard);

        expect(status).toBe("VALID_SPECIAL_REVERSE");
      }
    );
  });

  // Stack plus two card to the deck
  describe.each(
    // Create all draw2 card with specific color
    allColor.map(({ color }) => ({ draw2: `${color}draw2`, color }))
  )("Test all draw2 card with same card color", ({ draw2, color }) => {
    test.each(allNormalColor.filter(({ card }) => card.includes(color)))(
      `${draw2} could be stacked on $card because they are the same by card color`,
      ({ card }) => {
        const status = compareTwoCard(card as allCard, draw2 as allCard);

        expect(status).toBe("VALID_SPECIAL_DRAW2");
      }
    );
  });

  // Stack same special card type to the deck
  test.each(
    allColor.flatMap(({ color }) =>
      allColor
        .filter((type) => type.color !== color)
        .flatMap((opposite) =>
          allSpecialCard.map((special) => {
            const firstCard = `${opposite.color}${special.type}` as allCard;
            const secondCard = `${color}${special.type}` as allCard;

            return {
              firstCard,
              secondCard,
              expected:
                special.type === "reverse"
                  ? "VALID_SPECIAL_REVERSE"
                  : special.type === "skip"
                  ? "VALID_SPECIAL_SKIP"
                  : special.type === "draw2"
                  ? "VALID_SPECIAL_DRAW2"
                  : null,
            };
          })
        )
    )
  )(
    "$firstCard and $secondCard can be stacked because they are special card but different color",
    ({ firstCard, secondCard, expected }) => {
      const state = compareTwoCard(firstCard, secondCard);

      expect(state).toBe(expected);
    }
  );
});

describe("Card comparer unit test [UNMATCH]", () => {
  it("Normal card compared to normal card but all card are unmatch", () => {
    const allPossibleCombination = allColor.flatMap((type) =>
      allColor
        .filter(({ color }) => color !== type.color)
        .flatMap((opposite) => {
          const deckCard = `${type.color}4` as allCard;
          const givenCard = `${opposite}5` as allCard;

          return compareTwoCard(deckCard, givenCard);
        })
    );

    expect(allPossibleCombination.length).toEqual(12);
    expect(
      allPossibleCombination.every((combination) => combination === "UNMATCH")
    ).toBe(true);
  });

  it("Stack plus 4 compared to normal card but all card are unmatch", () => {
    const allPossibleCombination = allColor.flatMap((type) =>
      allColor
        .filter(({ color }) => color !== type.color)
        .flatMap((opposite) => {
          const deckCard = `wildddraw4${type.color}` as allCard;
          const givenCard = `${opposite.color}4` as allCard;

          return compareTwoCard(deckCard, givenCard);
        })
    );

    expect(allPossibleCombination.length).toEqual(12);
    expect(
      allPossibleCombination.every((combination) => combination === "UNMATCH")
    ).toBe(true);
  });

  it("Stack wild compared to normal card but all card are unmatch", () => {
    const allPossibleCombination = allColor.flatMap((type) =>
      allColor
        .filter(({ color }) => color !== type.color)
        .flatMap((opposite) => {
          const deckCard = `wild${opposite.color}` as allCard;
          const givenCard = `${type.color}4` as allCard;

          return compareTwoCard(deckCard, givenCard);
        })
    );

    expect(allPossibleCombination.length).toEqual(12);
    expect(
      allPossibleCombination.every((combination) => combination === "UNMATCH")
    ).toBe(true);
  });

  it("Stack special compared to special card but all card are unmatch", () => {
    const allPossibleCombination = allSpecialCard
      .flatMap((special) =>
        allSpecialCard
          .filter(({ type }) => type !== special.type)
          .flatMap((oppositeType) =>
            allColor.flatMap((color) =>
              allColor
                .filter((type) => type.color !== color.color)
                .flatMap((oppositeColor) => {
                  const deckCard =
                    `${oppositeColor.color}${oppositeType.type}` as allCard;
                  const givenCard = `${color.color}${special.type}` as allCard;

                  return compareTwoCard(deckCard, givenCard);
                })
            )
          )
      )
      .flat(4);

    console.log(JSON.stringify(allPossibleCombination, null, 2));

    expect(allPossibleCombination.length).toEqual(72);
    expect(
      allPossibleCombination.every((combination) => combination === "UNMATCH")
    ).toBe(true);
  });
});
