import mongoose from "mongoose";

import ChatLib from "./Chat.js";

import GameModel from "../models/game.js";
import UserModel from "../models/user.js";
import CardModel from "../models/card.js";

import shuffleArray from "../utils/shuffleArray.js";

export default class Game {
  constructor(gameData, chat) {
    if (!(gameData instanceof GameModel)) throw new Error("Invalid game data!");
    else if (!(chat instanceof ChatLib))
      throw new Error("Invalid Chat argument!");

    this.chat = chat;
    this.game = gameData;
  }

  async startGame() {
    const shuffledPlayer = shuffleArray(this.players);
    const currentPlayer = shuffledPlayer[0];

    this.game.status = "PLAYING";
    this.game.startTime = Date.now();
    this.game.playerOrder = shuffledPlayer.map(({ _id }) => ({ _id }));
    this.game.currentPosition = currentPlayer._id;

    await this.game.save();
  }

  async joinGame() {
    this.game.players.push({ user_id: this.chat.user._id });

    this.chat.user.gameProperty.isJoiningGame = true;
    this.chat.user.gameProperty.gameUID = this.game._id;
    this.chat.user.gameProperty.gameID = this.game.gameID;

    await Promise.all([this.chat.user.save(), this.game.save()]);
  }

  async endGame() {
    const copyPlayer = [...this.players];
    const copyCreator = Object.assign({}, this.creator)._doc;

    this.game.endTime = Date.now();
    this.game.status = "ENDING";
    this.game.playerOrder = [];
    this.game.players = [];

    await Promise.all(
      [...copyPlayer].map(
        async ({ _id }) =>
          await UserModel.findOneAndUpdate(
            { _id },
            {
              gameProperty: {
                isJoiningGame: false,
              },
            }
          )
      )
    );

    await Promise.all([
      this.game.save(),
      CardModel.deleteMany({ game_id: this.game._id }),
    ]);

    await Promise.all([
      this.chat.sendToOtherPlayers(
        copyPlayer,
        `${copyCreator.userName} telah menghentikan permainan. Terimakasih sudah bermain!`
      ),
      this.chat.replyToCurrentPerson(
        "Game berhasil dihentikan. Terimakasih sudah bermain!"
      ),
    ]);
  }

  async updateCardAndPosition(card, position) {
    this.game.currentCard = card;
    this.game.currentPosition = position;

    await this.game.save();
  }

  async sendToOtherPlayersWithoutCurrentPlayer(text) {
    await Promise.all(
      this.players
        .filter((user) => user.phoneNumber !== this.chat.userNumber)
        .filter(({ _id }) => !_id.equals(this.currentPlayer._id))
        .map(
          async (user) =>
            await this.chat.sendToOtherPlayer(
              `${String(user.phoneNumber).replace("+", "")}@c.us`,
              text
            )
        )
    );
  }

  get state() {
    return {
      WAITING: this.game.status === "WAITING",
      PLAYING: this.game.status === "PLAYING",
      ENDING: this.game.status === "ENDING",
    };
  }

  get NotFound() {
    return !this.game;
  }

  get translatedStatus() {
    switch (this.game.status) {
      case "WAITING":
        return "Menunggu Pemain";
      case "PLAYING":
        return "Sedang Bermain";
      case "ENDING":
        return "Selesai Bermain";
      default:
        return "N/A";
    }
  }

  get gameID() {
    return this.game.gameID;
  }

  get players() {
    return this.game.players.map(({ user_id }) => user_id);
  }

  get currentCard() {
    return this.game.currentCard;
  }

  get creator() {
    return this.players.find(({ _id }) => this.game.gameCreatorID.equals(_id));
  }

  get isGameCreator() {
    return this.game.gameCreatorID.equals(this.chat?.user._id);
  }

  get currentPlayer() {
    return this.players.find(({ _id }) =>
      this.game.currentPosition.equals(_id)
    );
  }

  get currentPlayerIsAuthor() {
    return this.creator._id.equals(this.game.currentPosition);
  }
}
