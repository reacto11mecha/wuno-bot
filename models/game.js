import mongoose from "mongoose";
import { nanoid } from "nanoid";

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
  currentCardColor: {
    type: String,
  },
  currentCardNumber: {
    type: Number,
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
