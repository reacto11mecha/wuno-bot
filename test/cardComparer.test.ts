import { compareTwoCard } from "../src/config/cards";
import type { allCard } from "../src/config/cards";

const allColor = ["red", "green", "blue", "yellow"];
const allSpecialCard = ["reverse", "skip", "draw2"];

describe("Card comparer unit test [STACK | STACK WILD | STACK SPECIAL]", () => {
  it("Stack the card if it's the same color", () => {
    const shouldBeSuccessRed = compareTwoCard("red2", "red5");
    const shouldBeSuccessGreen = compareTwoCard("green0", "green7");
    const shouldBeSuccessBlue = compareTwoCard("blue1", "blue8");
    const shouldBeSuccessYellow = compareTwoCard("yellow3", "yellow4");

    expect(
      [
        shouldBeSuccessRed,
        shouldBeSuccessGreen,
        shouldBeSuccessBlue,
        shouldBeSuccessYellow,
      ].every((card) => card === "STACK")
    ).toBe(true);
  });

  it("Stack the card if it's the same number", () => {
    const sameNumberRedGreen = compareTwoCard("red5", "green5");
    const sameNumberRedBlue = compareTwoCard("red5", "blue5");
    const sameNumberRedYellow = compareTwoCard("red5", "yellow5");

    const sameNumberGreenBlue = compareTwoCard("green0", "blue0");
    const sameNumberGreenYellow = compareTwoCard("green0", "yellow0");
    const sameNumberGreenRed = compareTwoCard("green0", "red0");

    const sameNumberYellowRed = compareTwoCard("yellow3", "red3");
    const sameNumberYellowGreen = compareTwoCard("yellow3", "green3");
    const sameNumberYellowBlue = compareTwoCard("yellow3", "blue3");

    expect(
      [
        sameNumberRedGreen,
        sameNumberRedBlue,
        sameNumberRedYellow,

        sameNumberGreenBlue,
        sameNumberGreenYellow,
        sameNumberGreenRed,

        sameNumberYellowRed,
        sameNumberYellowGreen,
        sameNumberYellowBlue,
      ].every((card) => card === "STACK")
    ).toBe(true);
  });

  it("Stack plus 4 whatever the normal color is", () => {
    const colorWNumber = allColor.map((color) => `${color}5` as allCard);
    const plus4WColor = allColor.map((color) => `wilddraw4${color}` as allCard);

    const allPossibleCombination = colorWNumber
      .map((card) =>
        plus4WColor.map((wildPlus4) => compareTwoCard(card, wildPlus4))
      )
      .reduce((curr, acc) => curr.concat(acc));

    expect(allPossibleCombination.length).toEqual(16);
    expect(
      allPossibleCombination.every(
        (combination) => combination === "STACK_PLUS_4"
      )
    ).toBe(true);
  });

  it("Stack wild whatever the normal color is", () => {
    const colorWNumber = allColor.map((color) => `${color}1` as allCard);
    const WildWithColor = allColor.map((color) => `wild${color}` as allCard);

    const allPossibleCombination = colorWNumber
      .map((card) =>
        WildWithColor.map((wildCard) => compareTwoCard(card, wildCard))
      )
      .reduce((curr, acc) => curr.concat(acc));

    expect(allPossibleCombination.length).toEqual(16);
    expect(
      allPossibleCombination.every(
        (combination) => combination === "STACK_WILD"
      )
    ).toBe(true);
  });

  it("Stack special card if the card is the same color as the deck card color", () => {
    const allPossibleCombination = allSpecialCard
      .map((type) =>
        allColor.map((card) => {
          const normalColor = `${card}8` as allCard;
          const specialColor = `${card}${type}` as allCard;

          return compareTwoCard(normalColor, specialColor);
        })
      )
      .reduce((curr, acc) => curr.concat(acc));

    expect(allPossibleCombination.length).toEqual(12);
    expect(
      allSpecialCard
        .map((special) => `VALID_SPECIAL_${special.toUpperCase()}`)
        .map((type) =>
          allPossibleCombination.some((combination) => combination === type)
        )
        .every((combinationType) => combinationType === true)
    ).toBe(true);
  });

  it("Stack special color with the same special type but different color", () => {
    const allPossibleCombination = allColor
      .map((color) =>
        allColor
          .filter((type) => type !== color)
          .map((opposite) =>
            allSpecialCard.map((special) => {
              const deckCard = `${opposite}${special}` as allCard;
              const givenCard = `${color}${special}` as allCard;

              return compareTwoCard(deckCard, givenCard);
            })
          )
      )
      .map((data) => data.reduce((curr, acc) => curr.concat(acc)))
      .reduce((curr, acc) => curr.concat(acc));

    expect(allPossibleCombination.length).toEqual(36);
    expect(
      allSpecialCard
        .map((special) => `VALID_SPECIAL_${special.toUpperCase()}`)
        .map((type) =>
          allPossibleCombination.some((combination) => combination === type)
        )
        .every((combinationType) => combinationType === true)
    ).toBe(true);
  });

  it("Stack card if the color is the same as wild color in the deck", () => {
    const colorWNumber = allColor.map((color) => `${color}2` as allCard);

    const allPossibleCombination = colorWNumber.map((card) => {
      const normalColor = `${card}2` as allCard;
      const wildColor = `wild${card}` as allCard;

      return compareTwoCard(wildColor, normalColor);
    });

    expect(allPossibleCombination.length).toEqual(4);
    expect(
      allPossibleCombination.every((combination) => combination === "STACK")
    ).toBe(true);
  });

  it("Stack card if the color is the same as wilddraw4 color in the deck", () => {
    const colorWNumber = allColor.map((color) => `${color}3` as allCard);

    const allPossibleCombination = colorWNumber.map((card) => {
      const normalColor = `${card}2` as allCard;
      const wildPlus4Color = `wilddraw4${card}` as allCard;

      return compareTwoCard(wildPlus4Color, normalColor);
    });

    expect(allPossibleCombination.length).toEqual(4);
    expect(
      allPossibleCombination.every((combination) => combination === "STACK")
    ).toBe(true);
  });
});

describe("Card comparer unit test [UNMATCH]", () => {
  it("Normal card compared to normal card but all card are unmatch", () => {
    const allPossibleCombination = allColor
      .map((type) =>
        allColor
          .filter((color) => color !== type)
          .map((opposite) => {
            const deckCard = `${type}4` as allCard;
            const givenCard = `${opposite}5` as allCard;

            return compareTwoCard(deckCard, givenCard);
          })
      )
      .reduce((curr, acc) => curr.concat(acc));

    expect(allPossibleCombination.length).toEqual(12);
    expect(
      allPossibleCombination.every((combination) => combination === "UNMATCH")
    ).toBe(true);
  });

  it("Stack plus 4 compared to normal card but all card are unmatch", () => {
    const allPossibleCombination = allColor
      .map((type) =>
        allColor
          .filter((color) => color !== type)
          .map((opposite) => {
            const deckCard = `wildddraw4${type}` as allCard;
            const givenCard = `${opposite}4` as allCard;

            return compareTwoCard(deckCard, givenCard);
          })
      )
      .reduce((curr, acc) => curr.concat(acc));

    expect(allPossibleCombination.length).toEqual(12);
    expect(
      allPossibleCombination.every((combination) => combination === "UNMATCH")
    ).toBe(true);
  });

  it("Stack wild compared to normal card but all card are unmatch", () => {
    const allPossibleCombination = allColor
      .map((type) =>
        allColor
          .filter((color) => color !== type)
          .map((opposite) => {
            const deckCard = `wild${opposite}` as allCard;
            const givenCard = `${type}4` as allCard;

            return compareTwoCard(deckCard, givenCard);
          })
      )
      .reduce((curr, acc) => curr.concat(acc));

    expect(allPossibleCombination.length).toEqual(12);
    expect(
      allPossibleCombination.every((combination) => combination === "UNMATCH")
    ).toBe(true);
  });

  it("Stack special compared to special card but all card are unmatch", () => {
    const allPossibleCombination = allSpecialCard
      .map((special) =>
        allSpecialCard
          .filter((type) => type !== special)
          .map((oppositeType) =>
            allColor.map((color) =>
              allColor
                .filter((type) => type !== color)
                .map((oppositeColor) => {
                  const deckCard = `${oppositeColor}${oppositeType}` as allCard;
                  const givenCard = `${color}${special}` as allCard;

                  return compareTwoCard(deckCard, givenCard);
                })
            )
          )
      )
      .map((data) => data.reduce((curr, acc) => curr.concat(acc)))
      .map((data) => data.reduce((curr, acc) => curr.concat(acc)))
      .reduce((curr, acc) => curr.concat(acc));

    expect(allPossibleCombination.length).toEqual(72);
    expect(
      allPossibleCombination.every((combination) => combination === "UNMATCH")
    ).toBe(true);
  });
});
