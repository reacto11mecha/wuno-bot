import mongoose from "mongoose";

import cards from "../config/cards.js";
import { Card as CardLib } from "../lib/index.js";

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
    default: () => [...new Array(6)].map(CardLib.pickRandomCard),
  },
});

export default mongoose.model("Card", Card);
