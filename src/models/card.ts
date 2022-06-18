import { model, Schema, Types } from "mongoose";

import { cards, type allCard } from "../config/cards";
import { Card as CardLib } from "../lib/Card";

interface ICard {
  user_id: Types.ObjectId;
  game_id: Types.ObjectId;
  cards: allCard[];
}

const Card = new Schema<ICard>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  game_id: {
    type: Schema.Types.ObjectId,
    ref: "Game",
  },
  cards: {
    type: [String],
    enums: cards,
    default: () => [...new Array(6)].map(CardLib.pickRandomCard),
  },
});

export default model<ICard>("Card", Card);
