import { compareTwoCard } from "../src/config/cards";

describe("Card comparer unit test", () => {
  it("should be success", () => {
    const shouldBeSuccess = compareTwoCard("red2", "red5");

    expect(shouldBeSuccess).toBe("STACK");
  });
});
