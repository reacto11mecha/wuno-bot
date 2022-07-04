import fs from "fs";
import path from "path";
import sharp from "sharp";

import type { allCard } from "../config/cards";

const cardsDir = path.join(path.resolve(), "assets/images/cards");

const cardBuilder = (width: number, height: number) =>
  sharp(path.join(cardsDir, "blank.png"), {
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  });

export const getCardImage = (card: allCard) =>
  fs.readFileSync(path.join(cardsDir, `${card}.png`));

export const createCardsImageFront = async (cards: allCard[]) => {
  return await cardBuilder(cards.length * 95, 137)
    .composite(
      cards.map((card, idx) => ({
        input: path.join(cardsDir, `${card}.png`),
        left: 95 * idx,
        top: 0,
      }))
    )
    .toFormat("png")
    .toBuffer();
};

export const createCardsImageBack = async (cardsLength: number) => {
  return await cardBuilder(cardsLength * 95 - 10, 135)
    .composite(
      Array.from(new Array(cardsLength)).map((_, idx) => ({
        input: path.join(cardsDir, "back.png"),
        left: 95 * idx,
        top: 0,
      }))
    )
    .toFormat("png")
    .toBuffer();
};

export const createAllCardImage = async (
  currentCard: allCard,
  cards: allCard[]
) => {
  const currentCardImage = getCardImage(currentCard);
  const [frontCardsImage, backCardsImage] = await Promise.all([
    createCardsImageFront(cards),
    createCardsImageBack(cards.length),
  ]);

  return [currentCardImage, frontCardsImage, backCardsImage];
};
