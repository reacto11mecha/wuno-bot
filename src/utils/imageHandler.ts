import fs from "fs";
import path from "path";
import sharp from "sharp";
import NodeCache from "node-cache";

import type { DataURL } from "@open-wa/wa-automate";
import type { allCard } from "../config/cards";

const imgCache = new NodeCache({ stdTTL: 60 * 60 * 24 });
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

export const getCardImage = (card: allCard) => {
  const imgBuffer = fs.readFileSync(path.join(cardsDir, `${card}.png`));

  const img = `data:image/png;base64,${imgBuffer.toString("base64")}`;

  return img as DataURL;
};
export const createCardsImageFront = async (cards: allCard[]) => {
  const cacheKeyName = `front-${cards.join("-")}`;
  if (imgCache.has(cacheKeyName)) return imgCache.get(cacheKeyName) as DataURL;

  const imgBuffer = await cardBuilder(cards.length * 95, 137)
    .composite(
      cards.map((card, idx) => ({
        input: path.join(cardsDir, `${card}.png`),
        left: 95 * idx,
        top: 0,
      }))
    )
    .toFormat("png")
    .toBuffer();

  const img = `data:image/png;base64,${imgBuffer.toString("base64")}`;

  imgCache.set(cacheKeyName, img, 60 * 20);
  return img as DataURL;
};

export const createCardsImageBack = async (cardsLength: number) => {
  const cacheKeyName = `back${cardsLength}`;
  if (imgCache.has(cacheKeyName)) return imgCache.get(cacheKeyName) as DataURL;

  const imgBuffer = await cardBuilder(cardsLength * 95 - 10, 135)
    .composite(
      Array.from(new Array(cardsLength)).map((_, idx) => ({
        input: path.join(cardsDir, "back.png"),
        left: 95 * idx,
        top: 0,
      }))
    )
    .toFormat("png")
    .toBuffer();

  const img = `data:image/png;base64,${imgBuffer.toString("base64")}`;

  imgCache.set(cacheKeyName, img);
  return img as DataURL;
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
