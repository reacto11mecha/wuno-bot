import { model, Schema, Types } from "mongoose";
import { nanoid } from "nanoid";
import crypto from "crypto";

import { cards, type allCard } from "../config/cards.js";
const appropriateInitialCards = cards
  .filter((e) => !e.startsWith("wild"))
  .filter((e) => !e.endsWith("skip"))
  .filter((e) => !e.endsWith("draw2"))
  .filter((e) => !e.endsWith("reverse"));

const getRandomIndex = () => {
  const random =
    crypto.webcrypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
  return Math.floor(random * appropriateInitialCards.length);
};

const player = new Schema<{ user_id: Types.ObjectId }>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

interface IGame {
  gameID: string;
  status: "WAITING" | "PLAYING" | "ENDED";
  gameCreatorID: Types.ObjectId;
  startTime: Date;
  endTime: Date;
  currentCard: allCard;
  currentPosition: Types.ObjectId;
  playersOrder: [typeof player];
  players: [typeof player];
  created_at: Date;
}

const Game = new Schema<IGame>({
  gameID: {
    type: String,
    default: () => nanoid(11),
  },
  status: {
    type: String,
    enums: ["WAITING", "PLAYING", "ENDED"],
    default: "WAITING",
  },
  gameCreatorID: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  startTime: {
    type: Date,
  },
  endTime: {
    type: Date,
  },
  currentCard: {
    type: String,
    enums: cards,
    default: () => appropriateInitialCards[getRandomIndex()],
  },
  currentPosition: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  playersOrder: [player],
  players: [player],
  created_at: { type: Date, default: Date.now },
});

export default model<IGame>("Game", Game);
