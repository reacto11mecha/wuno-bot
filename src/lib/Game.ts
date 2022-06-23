import {
  DocumentType,
  isDocument,
  isDocumentArray,
} from "@typegoose/typegoose";
import { Types } from "mongoose";
import { Chat } from "./Chat";

import { random } from "../utils";
import {
  GameModel,
  Game as GameType,
  GameStatus,
  // User as UserModel,
  // Card as CardModel,
} from "../models";

import type { allCard } from "../config/cards";
import type { AnyMessageContent } from "@adiwajshing/baileys";

export class Game {
  private game: DocumentType<GameType>;
  private chat: Chat;

  constructor(gameData: DocumentType<GameType>, chat: Chat) {
    this.game = gameData;
    this.chat = chat;
  }

  async startGame() {
    const shuffledPlayer = this.game
      .players!.map((value) => ({ value, sort: random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
    const currentPlayer = shuffledPlayer[0];

    this.game.status = GameStatus.PLAYING;
    this.game.startTime = new Date();
    this.game.playersOrder = shuffledPlayer;
    this.game.currentPosition = currentPlayer;

    await this.game.save();
  }

  async joinGame() {
    this.game.players!.push(this.chat.user!._id);

    this.chat.user!.gameProperty!.isJoiningGame = true;
    this.chat.user!.gameProperty!.gameUID = this.game._id;
    this.chat.user!.gameProperty!.gameID = this.game.gameID;

    await Promise.all([this.chat.user!.save(), this.game.save()]);
  }

  // async endGame() {
  //   const copyPlayer = [...this.players];
  //
  //   this.game.endTime = new Date();
  //   this.game.status = "ENDED";
  //   this.game.playersOrder = [];
  //   this.game.players = [];
  //
  //   await Promise.all(
  //     [...copyPlayer].map(async ({ __id }) => await this.leaveGameForUser(__id))
  //   );
  //
  //   await Promise.all([
  //     this.game.save(),
  //     CardModel.deleteMany({ game_id: this._id }),
  //   ]);
  // }
  //
  // async leaveGameForUser(__id: Types.Object_id) {
  //   await UserModel.findOneAndUpdate(
  //     { __id },
  //     {
  //       gameProperty: {
  //         isJoiningGame: false,
  //       },
  //     }
  //   );
  // }

  async updatePosition(position: Types.ObjectId) {
    this.game.currentPosition = position;

    await this.game.save();
  }

  async updateCardAndPosition(card: allCard, position: Types.ObjectId) {
    this.game.currentCard = card;
    this.game.currentPosition = position;

    await this.game.save();
  }

  async sendToOtherPlayersWithoutCurrentPlayer(message: AnyMessageContent) {
    if (isDocumentArray(this.game.players)) {
      await Promise.all(
        this.game
          .players!.filter(
            (user) => user.phoneNumber !== this.chat.message.userNumber
          )
          .filter((id) => id !== this.game.currentPosition)
          .map(
            async (user) =>
              await this.chat.sendToOtherPerson(user.phoneNumber, message)
          )
      );
    }
  }

  async sendToOtherPlayersWithoutCurrentPerson(message: AnyMessageContent) {
    if (isDocumentArray(this.game.players)) {
      await Promise.all(
        this.game
          .players!.filter(
            (user) => user.phoneNumber !== this.chat.message.userNumber
          )
          .map(
            async (user) =>
              await this.chat.sendToOtherPerson(user.phoneNumber, message)
          )
      );
    }
  }

  get gameID() {
    return this.game.gameID;
  }

  get state() {
    return {
      WAITING: this.game.status === "WAITING",
      PLAYING: this.game.status === "PLAYING",
      ENDED: this.game.status === "ENDED",
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
      case "ENDED":
        return "Selesai Bermain";
      default:
        return "N/A";
    }
  }

  get players() {
    return this.game.players;
  }

  get currentCard() {
    return this.game.currentCard;
  }

  get creator() {
    return this.players!.find(
      (player) =>
        isDocument(player) && player._id.equals(this.game.gameCreatorID)
    );
  }

  get isGameCreator() {
    return this.chat.user!._id.equals(this.game.gameCreatorID);
  }

  get currentPlayer() {
    return this.players?.find(
      (player) =>
        isDocument(player) && player._id.equals(this.game.currentPosition)
    );
  }

  get currentPlayerIsAuthor() {
    return (
      isDocument(this.creator) &&
      this.creator?._id.equals(this.game.currentPosition)
    );
  }
}
