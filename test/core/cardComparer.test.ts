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
    card: `${color}${number}` as allCard,
  })),
);

describe("Card comparer unit test [STACK | STACK WILD | STACK SPECIAL]", () => {
  describe("Stack card because the cards have same color", () => {
    test.each(
      // Create an array of deckCard
      // and givenCard with same color
      allColor.flatMap((colorItem) =>
        allValidNumbers.flatMap((numberItem) => {
          const deckCard = `${colorItem.color}${numberItem.number}` as allCard;
          const givenCard = allValidNumbers.map(
            (secondNumberItem) =>
              `${colorItem.color}${secondNumberItem.number}` as allCard,
          );

          return givenCard.map((gc) => ({ deckCard, givenCard: gc }));
        }),
      ),
    )(
      "Should be succesfully stack $deckCard and $givenCard",
      ({ deckCard, givenCard }) => {
        const status = compareTwoCard(deckCard, givenCard);

        expect(status).toBe("STACK");
      },
    );
  });

  describe("Stack card because the cards have same number", () => {
    // Stack all card with the same number
    test.each(
      // Create an array of deckCard and givenCard
      // with different color but with the same number
      allValidNumbers.flatMap(({ number }) =>
        allColor.flatMap(({ color }) => {
          const deckCard = `${color}${number}` as allCard;

          return allColor
            .filter((currentColor) => currentColor.color !== color)
            .map((currentColor) => ({
              deckCard,
              givenCard: `${currentColor.color}${number}` as allCard,
            }));
        }),
      ),
    )(
      "Should be succesfully stack $deckCard and $givenCard",
      ({ deckCard, givenCard }) => {
        const status = compareTwoCard(deckCard, givenCard);

        expect(status).toBe("STACK");
      },
    );
  });

  // Stack wild plus 4 to the deck
  describe.each(
    // Create wilddraw4 with all color
    allColor.map(({ color }) => ({
      wildPlus4: `wilddraw4${color}` as allCard,
    })),
  )("Test if plus 4 card could stack on normal color", ({ wildPlus4 }) => {
    test.each(allNormalColor)(
      "Plus 4 card could stack on $card",
      ({ card }) => {
        const status = compareTwoCard(card, wildPlus4);

        expect(status).toBe("STACK_PLUS_4");
      },
    );
  });

  // The plus 4 is already on the deck, player will stack their card
  describe.each(
    // Create wilddraw4 card with all color
    allColor.map(({ color }) => ({
      wildDraw4: `wilddraw4${color}` as allCard,
      color,
    })),
  )(
    "Test if normal coloured card can stack normally on specific wilddraw4 on the deck",
    ({ wildDraw4, color }) => {
      test.each(allNormalColor.filter(({ card }) => card.includes(color)))(
        `$card could be stacked on ${wildDraw4}`,
        ({ card }) => {
          const status = compareTwoCard(wildDraw4, card);

          expect(status).toBe("STACK");
        },
      );
    },
  );

  // Stack wild color to the deck, it'll bypass all normal coloured card
  describe.each(
    // Create wild card with all color
    allColor.map(({ color }) => ({ wild: `wild${color}` as allCard })),
  )("Test if wild card can bypass all normal coloured card", ({ wild }) => {
    test.each(allNormalColor)(
      `${wild} card could stack on $card`,
      ({ card }) => {
        const status = compareTwoCard(card, wild);

        expect(status).toBe("STACK_WILD");
      },
    );
  });

  // Specific coloured wild card already on the deck,
  // player want to stack the card with normal card
  describe.each(
    // Create wild card with all color
    allColor.map(({ color }) => ({ wild: `wild${color}` as allCard, color })),
  )(
    "Test if normal coloured card can stack normally on specific wild on the deck",
    ({ wild, color }) => {
      test.each(allNormalColor.filter(({ card }) => card.includes(color)))(
        `$card could be stacked on ${wild}`,
        ({ card }) => {
          const status = compareTwoCard(wild, card);

          expect(status).toBe("STACK");
        },
      );
    },
  );

  // Stack skip card to the deck
  describe.each(
    // Create all skip card with specific color
    allColor.map(({ color }) => ({ skipCard: `${color}skip`, color })),
  )("Test all skip card with same card color", ({ skipCard, color }) => {
    test.each(allNormalColor.filter(({ card }) => card.includes(color)))(
      `${skipCard} could be stacked on $card`,
      ({ card }) => {
        const status = compareTwoCard(card as allCard, skipCard as allCard);

        expect(status).toBe("VALID_SPECIAL_SKIP");
      },
    );
  });

  // Stack reverse card to the deck
  describe.each(
    // Create all reverse card with specific color
    allColor.map(({ color }) => ({ reverseCard: `${color}reverse`, color })),
  )("Test all reverse card with same card color", ({ reverseCard, color }) => {
    test.each(allNormalColor.filter(({ card }) => card.includes(color)))(
      `${reverseCard} could be stacked on $card`,
      ({ card }) => {
        const status = compareTwoCard(card as allCard, reverseCard as allCard);

        expect(status).toBe("VALID_SPECIAL_REVERSE");
      },
    );
  });

  // Stack plus two card to the deck
  describe.each(
    // Create all draw2 card with specific color
    allColor.map(({ color }) => ({ draw2: `${color}draw2`, color })),
  )("Test all draw2 card with same card color", ({ draw2, color }) => {
    test.each(allNormalColor.filter(({ card }) => card.includes(color)))(
      `${draw2} could be stacked on $card`,
      ({ card }) => {
        const status = compareTwoCard(card as allCard, draw2 as allCard);

        expect(status).toBe("VALID_SPECIAL_DRAW2");
      },
    );
  });

  describe("Stack same special card type but with different color", () => {
    // Stack same special card type to the deck
    test.each(
      allColor.flatMap(({ color }) =>
        allColor
          .filter((type) => type.color !== color)
          .flatMap((opposite) =>
            allSpecialCard.map((special) => {
              const deckCard = `${opposite.color}${special.type}` as allCard;
              const givenCard = `${color}${special.type}` as allCard;

              return {
                deckCard,
                givenCard,
                expected:
                  special.type === "reverse"
                    ? "VALID_SPECIAL_REVERSE"
                    : special.type === "skip"
                      ? "VALID_SPECIAL_SKIP"
                      : special.type === "draw2"
                        ? "VALID_SPECIAL_DRAW2"
                        : null,
              };
            }),
          ),
      ),
    )(
      "$deckCard and $givenCard can be stacked ($expected)",
      ({ deckCard, givenCard, expected }) => {
        const state = compareTwoCard(deckCard, givenCard);

        expect(state).toBe(expected);
      },
    );
  });

  describe("Stack special card to plus 4 card and still doing the special card thing", () => {
    test.each(
      allColor.flatMap(({ color }) =>
        allSpecialCard.map((special) => {
          const deckCard = `wilddraw4${color}` as allCard;
          const givenCard = `${color}${special.type}` as allCard;

          return {
            deckCard,
            givenCard,
            expected:
              special.type === "reverse"
                ? "VALID_SPECIAL_REVERSE"
                : special.type === "skip"
                  ? "VALID_SPECIAL_SKIP"
                  : special.type === "draw2"
                    ? "VALID_SPECIAL_DRAW2"
                    : null,
          };
        }),
      ),
    )(
      "Can stack $givenCard to $deckCard ($expected)",
      ({ deckCard, givenCard, expected }) => {
        const state = compareTwoCard(deckCard, givenCard);

        expect(state).toBe(expected);
      },
    );
  });

  describe("Stack wild card to plus 4 card and still valid wild", () => {
    test.each(
      allColor.flatMap(({ color }) =>
        allColor.map((given) => ({
          deckCard: `wilddraw4${color}` as allCard,
          givenCard: `wild${given.color}` as allCard,
        })),
      ),
    )("Can stack $givenCard to $deckCard", ({ deckCard, givenCard }) => {
      const state = compareTwoCard(deckCard, givenCard);

      expect(state).toBe("STACK_WILD");
    });
  });
});

describe("Card comparer unit test [UNMATCH]", () => {
  const fnTest = ({
    deckCard,
    givenCard,
  }: {
    deckCard: allCard;
    givenCard: allCard;
  }) => {
    const status = compareTwoCard(deckCard, givenCard);

    expect(status).toBe("UNMATCH");
  };

  describe("Normal card compared to normal card but all card are unmatch", () => {
    test.each(
      allColor.flatMap((type) =>
        allColor
          .filter(({ color }) => color !== type.color)
          .flatMap((opposite) =>
            allValidNumbers.flatMap((validNumberDeck) =>
              allValidNumbers
                .filter((given) => given.number !== validNumberDeck.number)
                .flatMap((validNumberGiven) => ({
                  deckCard: `${type.color}${validNumberDeck.number}` as allCard,
                  givenCard:
                    `${opposite.color}${validNumberGiven.number}` as allCard,
                })),
            ),
          ),
      ),
    )("$deckCard can't be stacked by $givenCard", fnTest);
  });

  describe("Stack plus 4 compared to normal card but all card are unmatch", () => {
    test.each(
      allColor.flatMap((type) =>
        allColor
          .filter(({ color }) => color !== type.color)
          .flatMap((opposite) => {
            const deckCard = `wildddraw4${type.color}` as allCard;

            return allValidNumbers.map(({ number }) => ({
              deckCard,
              givenCard: `${opposite.color}${number}` as allCard,
            }));
          }),
      ),
    )("$deckCard can't be stacked by $givenCard", fnTest);
  });

  describe("Stack wild compared to normal card but all card are unmatch", () => {
    test.each(
      allColor.flatMap((type) =>
        allColor
          .filter(({ color }) => color !== type.color)
          .flatMap((opposite) => {
            const deckCard = `wild${opposite.color}` as allCard;

            return allValidNumbers.map(({ number }) => ({
              deckCard,
              givenCard: `${type.color}${number}` as allCard,
            }));
          }),
      ),
    )("Can't stack $givenCard to $deckCard", fnTest);
  });

  describe("Can't stack different special card", () => {
    it.each(
      allSpecialCard
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
                    const givenCard =
                      `${color.color}${special.type}` as allCard;

                    return {
                      deckCard,
                      givenCard,
                    };
                  }),
              ),
            ),
        )
        .flat(4),
    )(
      "Can't stack special $deckCard compared to special card $givenCard",
      fnTest,
    );
  });

  describe("Can't stack special card to plus 4 card if it isn't the same color", () => {
    test.each(
      allColor.flatMap(({ color }) => {
        const deckCard = `wilddraw4${color}` as allCard;

        return allColor
          .filter((given) => given.color !== color)
          .flatMap((given) =>
            allSpecialCard.flatMap(({ type }) => ({
              deckCard,
              givenCard: `${given.color}${type}` as allCard,
            })),
          );
      }),
    )(
      "Can't stack plus 4 $deckCard compared to special card $givenCard",
      fnTest,
    );
  });
});
