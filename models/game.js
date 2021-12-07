import mongoose from "mongoose";
import { nanoid } from "nanoid";

import cards from "../config/cards.js";
const appropriateInitialCards = cards
  .filter((e) => !e.startsWith("wild"))
  .filter((e) => !e.endsWith("skip"))
  .filter((e) => !e.endsWith("draw2"))
  .filter((e) => !e.endsWith("reverse"));

const getRandomIndex = () =>
  Math.floor(Math.random() * appropriateInitialCards.length);

const player = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const Game = new mongoose.Schema({
  gameID: {
    type: String,
    default: () => nanoid(11),
  },
  status: {
    type: String,
    enums: ["WAITING", "PLAYING", "ENDING"],
    default: "WAITING",
  },
  gameCreatorID: {
    type: mongoose.Schema.Types.ObjectId,
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
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  playerOrder: [player],
  players: [player],
  created_at: { type: Date, default: Date.now },
});

export default mongoose.model("Game", Game);
