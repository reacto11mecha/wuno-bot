import ChatLib from "./Chat.js";
import GameModel from "../models/game.js";
import mongoose from "mongoose";

export default class Game {
  constructor(gameData, chat) {
    if (
      !(gameData instanceof mongoose.Query) ||
      !(gameData instanceof GameModel)
    )
      throw new Error("Invalid game data!");
    else if (!(chat instanceof ChatLib))
      throw new Error("Invalid Chat argument!");

    this.chat = chat;
    this.game = gameData;
  }

  get players() {
    return this.game.players.map(({ user_id }) => user_id);
  }
  get creator() {
    return this.players.find(({ _id }) => this.game.gameCreatorID.equals(_id));
  }
  get isGameCreator() {
    return this.game.gameCreatorID.equals(this.chat?.user._id);
  }
}
