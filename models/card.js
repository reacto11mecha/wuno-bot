import mongoose from "mongoose";

import cards from "../config/cards.js";

const appropriateInitialCards = cards
  .filter((e) => !e.startsWith("wild"))
  .filter((e) => !e.endsWith("skip"))
  .filter((e) => !e.endsWith("draw2"))
  .filter((e) => !e.endsWith("reverse"));

const getRandomIndex = () =>
  Math.floor(Math.random() * appropriateInitialCards.length);

const Card = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  game_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Game",
  },
  cards: {
    type: [String],
    enums: cards,
    default: () =>
      [...new Array(6)].map(() => appropriateInitialCards[getRandomIndex()]),
  },
});

export default mongoose.model("Card", Card);
