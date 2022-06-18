import { model, Schema, Types } from "mongoose";
import { nanoid } from "nanoid";

import { random } from "../utils";

import { cards, type allCard } from "../config/cards";
const appropriateInitialCards = cards
  .filter((e) => !e.startsWith("wild"))
  .filter((e) => !e.endsWith("skip"))
  .filter((e) => !e.endsWith("draw2"))
  .filter((e) => !e.endsWith("reverse"));

interface IPlayer {
  user_id: Types.ObjectId;
}

const player = new Schema<IPlayer>({
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
  playersOrder: IPlayer[];
  players: IPlayer[];
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
    default: () => {
      const idx = Math.floor(random() * appropriateInitialCards.length);
      return appropriateInitialCards[idx];
    },
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
