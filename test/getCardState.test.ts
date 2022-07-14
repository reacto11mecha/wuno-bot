import { CardPicker, EGetCardState } from "../src/config/cards";
import type { allCard } from "../src/config/cards";

const allColor = ["red", "green", "blue", "yellow"];
const allSpecialCard = ["reverse", "skip", "draw2"];

describe("Get card state unit test", () => {
  it("Function should return invalid state", () => {
    const { state } = CardPicker.getCardState("definitelynotacard" as allCard);

    expect(state).toBe(EGetCardState.INVALID);
  });

  it("Function should return normal card state", () => {
    const allCardState = allColor.map((color) =>
      CardPicker.getCardState(`${color}1` as allCard)
    );

    expect(allCardState.length).toBe(4);
    expect(
      allCardState.every((card) => card.state === EGetCardState.VALID_NORMAL)
    ).toBe(true);
    expect(allCardState.every((card) => card.number === 1)).toBe(true);
  });

  it("Function should return wilddraw4 card state", () => {
    const allCardState = allColor.map((color) =>
      CardPicker.getCardState(`wilddraw4${color}` as allCard)
    );

    expect(allCardState.length).toBe(4);
    expect(
      allCardState.every(
        (card) => card.state === EGetCardState.VALID_WILD_PLUS4
      )
    ).toBe(true);
  });

  it("Function should return wild card state", () => {
    const allCardState = allColor.map((color) =>
      CardPicker.getCardState(`wild${color}` as allCard)
    );

    expect(allCardState.length).toBe(4);
    expect(
      allCardState.every((card) => card.state === EGetCardState.VALID_WILD)
    ).toBe(true);
  });

  it("Function should return special card state", () => {
    const allCardState = allColor
      .map((color) =>
        allSpecialCard.map((special) =>
          CardPicker.getCardState(`${color}${special}` as allCard)
        )
      )
      .reduce((curr, acc) => curr.concat(acc));

    expect(
      allCardState.every((card) => card.state === EGetCardState.VALID_SPECIAL)
    ).toBe(true);
    expect(
      allSpecialCard
        .map((type) => allCardState.some((card) => card.type === type))
        .every((combinationType) => combinationType === true)
    ).toBe(true);
  });
});
