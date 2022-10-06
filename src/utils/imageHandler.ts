import fs from "fs";
import path from "path";
import sharp from "sharp";
import NodeCache from "node-cache";

import { MessageMedia } from "whatsapp-web.js";
import type { allCard } from "../config/cards";

const imgCache = new NodeCache({ stdTTL: 60 * 60 * 24 });
const cardsDir = path.join(path.resolve(), "assets/images/cards");

/**
 * Image card builder, will create blank image with certain width and height
 * @param width Width of the image
 * @param height Height of the image
 * @returns Sharp instance with blank background
 */
const cardBuilder = (width: number, height: number) =>
  sharp(path.join(cardsDir, "blank.png"), {
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  });

/**
 * Util for convert a given card that will generate a base64 image URL
 * @param card Valid given card
 * @returns A string of base64 image URL
 */
export const getCardImage = (card: allCard) => {
  const cacheKeyName = `an-image-${card}`;
  if (imgCache.has(cacheKeyName))
    return imgCache.get(cacheKeyName) as MessageMedia;

  const imgBuffer = fs.readFileSync(path.join(cardsDir, `${card}.png`));

  const img = new MessageMedia("image/png", imgBuffer.toString("base64"));

  imgCache.set(cacheKeyName, img);
  return img;
};

/**
 * Util for convert a given cards that will generate a front facing UNO card in base64 image URL
 * @param cards An array of valid given card
 * @returns A string of front facing UNO card in base64 image URL
 */
export const createCardsImageFront = async (cards: allCard[]) => {
  const cacheKeyName = `front-${cards.join("-")}`;
  if (imgCache.has(cacheKeyName))
    return imgCache.get(cacheKeyName) as MessageMedia;

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

  const img = new MessageMedia("image/png", imgBuffer.toString("base64"));

  imgCache.set(cacheKeyName, img, 60 * 20);
  return img;
};

/**
 * Util for convert a how many cards are in number that will generate a back facing UNO card in base64 image URL
 * @param cardsLength How many cards are in number
 * @returns A string of front facing UNO card in base64 image URL
 */
export const createCardsImageBack = async (cardsLength: number) => {
  const cacheKeyName = `back${cardsLength}`;
  if (imgCache.has(cacheKeyName))
    return imgCache.get(cacheKeyName) as MessageMedia;

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

  const img = new MessageMedia("image/png", imgBuffer.toString("base64"));

  imgCache.set(cacheKeyName, img);
  return img;
};

/**
 * Util for creating an images that coming from three different functions (getCardImage, createCardsImageFront, createCardsImageBack)
 * @param currentCard Valid given card
 * @param cards An array of valid given card
 * @returns An array that contains three results from the function mentioned before
 */
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
