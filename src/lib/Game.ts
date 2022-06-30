import {
  Ref,
  DocumentType,
  isRefTypeArray,
  isRefType,
  isDocument,
  isDocumentArray,
} from "@typegoose/typegoose";
import { Types } from "mongoose";
import { Chat } from "./Chat";

import { random } from "../utils";
import {
  GameModel,
  Game as GameType,
  User as UserType,
  GameStatus,
  UserModel,
  CardModel,
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

  private async getPojoSelf() {
    const pojo: {
      players: Types.ObjectId[];
      playersOrder: Types.ObjectId[];
      _id: Types.ObjectId;
    } = await GameModel.findOne({
      _id: this.game._id,
      gameID: this.game.gameID,
    }).lean();

    return pojo;
  }

  private _isPlayerTurn(user: DocumentType<UserType>) {
    return (
      isRefType(this.game.currentPosition, Types.ObjectId) &&
      this.game.currentPosition!.equals(user._id)
    );
  }

  async startGame() {
    const shuffledPlayer = this.game
      .players!.sort(() => random() - 0.5)
      .map((player) => isDocument(player) && player._id);
    const currentPlayer = shuffledPlayer[0];

    this.game.status = GameStatus.PLAYING;
    this.game.startTime = new Date();
    this.game.playersOrder = shuffledPlayer;
    this.game.currentPosition = currentPlayer;

    await this.game.save();
  }

  async joinGame() {
    this.chat.user!.gameProperty = {};

    this.chat.user!.gameProperty.isJoiningGame = true;
    this.chat.user!.gameProperty.gameUID = this.game._id;
    this.chat.user!.gameProperty.gameID = this.game.gameID;

    await Promise.all([
      this.chat.user!.save(),
      GameModel.findOneAndUpdate(
        { _id: this.game._id },
        { $push: { players: this.chat.user!._id } }
      ),
    ]);
  }

  async endGame() {
    const pojo = await this.getPojoSelf();

    this.game.endTime = new Date();
    this.game.status = GameStatus.ENDED;
    this.game.playersOrder = [];
    this.game.players = [];

    await Promise.all([
      this.game.save(),
      CardModel.deleteMany({ game: pojo._id }),
      [...pojo.players].map(async (id) => await this.leaveGameForUser(id)),
    ]);
  }

  async leaveGameForUser(_id: Types.ObjectId) {
    await UserModel.findOneAndUpdate(
      { _id },
      {
        gameProperty: {
          isJoiningGame: false,
        },
      }
    );
  }

  async removeUserFromArray(_id: Types.ObjectId) {
    const pojo = await this.getPojoSelf();

    const removedFromPlayersOrder = [...pojo.playersOrder].filter(
      (id) => !id.equals(_id)
    );
    const removedFromPlayers = [...pojo.players].filter(
      (id) => !id.equals(_id)
    );

    this.game.playersOrder = removedFromPlayersOrder;
    this.game.players = removedFromPlayers;

    await Promise.all([
      this.game.save(),
      this.leaveGameForUser(_id),
      CardModel.deleteOne({ user: _id, game_id: this.game._id }),
    ]);
  }

  async updatePosition(position: Types.ObjectId) {
    this.game.currentPosition = position;

    await this.game.save();
  }

  async updateCardAndPosition(card: allCard, position: Types.ObjectId) {
    this.game.currentCard = card;
    this.game.currentPosition = position;

    await this.game.save();
  }

  async reversePlayersOrder() {
    if (isRefTypeArray(this.game.playersOrder, Types.ObjectId)) {
      this.game.playersOrder = [...this.game.playersOrder].reverse();
      await this.game.save();
    }
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

  async sendToOtherPlayersWithoutCurrentPerson(
    message: AnyMessageContent,
    players?: Ref<UserType>[]
  ) {
    if (players && isDocumentArray(players)) {
      await Promise.all(
        players
          .filter((user) => user.phoneNumber !== this.chat.message.userNumber)
          .map(
            async (user) =>
              await this.chat.sendToOtherPerson(user.phoneNumber, message)
          )
      );
    } else if (isDocumentArray(this.game.players)) {
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

  async save() {
    await this.game.save();
  }

  getNextPosition(increment = 1) {
    if (isNaN(increment) || increment < 1) throw new Error("Invalid increment");

    if (isDocument(this.currentPlayer) && isDocumentArray(this.players)) {
      const playersOrder = [...(this.game.playersOrder as Types.ObjectId[])];
      const currentPlayer = this.currentPlayer;

      const currentIndex = playersOrder.findIndex((player) =>
        player._id.equals(currentPlayer._id)
      );
      const nextPlayerID =
        playersOrder[(currentIndex + increment) % playersOrder.length];

      return this.players.find((player) => player._id.equals(nextPlayerID));
    }
  }

  get playersOrderIds() {
    return this.game.playersOrder;
  }

  get uid() {
    return this.game._id;
  }

  get gameID() {
    return this.game.gameID;
  }

  get currentPositionId() {
    return <Types.ObjectId>(<unknown>this.game.currentPosition);
  }

  get created_at() {
    return this.game.created_at;
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
    return this.players!.find(
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

  get isCurrentChatTurn() {
    return this._isPlayerTurn(this.chat.user!);
  }

  set gameCreatorID(id: Types.ObjectId) {
    this.game.gameCreatorID = id;
  }
}
