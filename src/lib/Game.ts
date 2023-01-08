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

import { calcElapsedTime, random } from "../utils";
import {
  GameModel,
  Game as GameType,
  User as UserType,
  GameStatus,
  UserModel,
  CardModel,
} from "../models";

import type { allCard } from "../config/cards";
import {
  MessageContent,
  MessageMedia,
  MessageSendOptions,
} from "whatsapp-web.js";

/**
 * Class for handling user game event
 */
export class Game {
  /**
   * Game document by specific user
   */
  private game: DocumentType<GameType>;

  /**
   * Chat message instance
   */
  private chat: Chat;

  /**
   * Game class constructor
   * @param gameData Game document by specific user
   * @param chat Chat message instance
   */
  constructor(gameData: DocumentType<GameType>, chat: Chat) {
    this.game = gameData;
    this.chat = chat;
  }

  /**
   * Function that can get POJO (Pure JavaScript Object) document of current game session
   * @returns POJO document of current game session
   */
  async getPojoSelf() {
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

  /**
   * Abstract function that used for checking specific player is it turn or not
   * @param user The specific player
   * @returns Boolean that indicate is player turn or not
   */
  private _isPlayerTurn(user: DocumentType<UserType>) {
    return (
      isRefType(this.game.currentPosition, Types.ObjectId) &&
      this.game.currentPosition!.equals(user._id)
    );
  }

  /**
   * Function for starting current game
   */
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

  /**
   * Function for joining current game
   */
  async joinGame() {
    await Promise.all([
      this.chat.setUserGameProperty({
        isJoiningGame: true,
        gameUID: this.game._id,
        gameID: this.game.gameID,
      }),
      GameModel.findOneAndUpdate(
        { _id: this.game._id },
        { $push: { players: this.chat.user!._id } }
      ),
    ]);
  }

  /**
   * Function for end current game
   */
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

    this.chat.logger.info(`[DB] Game ${this.game.gameID} selesai`);
  }

  /**
   * Function for updating user gameProperty for not joining game session anymore
   * @param _id Specific user id
   */
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

  /**
   * Function for removing user from player array (leaving, get kicked)
   * @param _id Specific user id
   */
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
      CardModel.deleteOne({ user: _id, game: this.game._id }),
    ]);
  }

  /**
   * Function for adding user on banned player array
   * @param _id Specific user id
   */
  async addUserToBannedList(_id: Types.ObjectId) {
    await GameModel.updateOne(
      { _id: this.game._id },
      { $push: { bannedPlayers: _id } }
    );
  }

  /**
   * Function for updating game current position
   * @param position User specific id
   */
  async updatePosition(position: Types.ObjectId) {
    this.game.currentPosition = position;

    await this.game.save();
  }

  /**
   * Function for updating game current card and current position
   * @param card Valid given card
   * @param position User specific id
   */
  async updateCardAndPosition(card: allCard, position: Types.ObjectId) {
    this.game.currentCard = card;
    this.game.currentPosition = position;

    await this.game.save();
  }

  /**
   * Function for reversing players order (uno reverse card)
   */
  async reversePlayersOrder() {
    if (isRefTypeArray(this.game.playersOrder, Types.ObjectId)) {
      this.game.playersOrder = [...this.game.playersOrder].reverse();
      await this.game.save();
    }
  }

  /**
   * Send message or image with caption to all players without current player
   * @param message Text that will sended
   * @param image Image that will sended (Optional)
   */
  async sendToOtherPlayersWithoutCurrentPlayer(
    message: MessageContent | MessageSendOptions,
    image?: MessageMedia
  ) {
    if (isDocumentArray(this.game.players)) {
      await Promise.all(
        this.game
          .players!.filter(
            (user) => user.phoneNumber !== this.chat.message.userNumber
          )
          .filter((id) => id !== this.game.currentPosition)
          .map(
            async (user) =>
              await this.chat.sendToOtherPerson(
                user.phoneNumber,
                message,
                image
              )
          )
      );
    }
  }

  /**
   * Send message or image with caption to all players without current person
   * @param message Text that will sended
   * @param players Players list (optional)
   * @param image Image that will send (optional)
   */
  async sendToOtherPlayersWithoutCurrentPerson(
    message: MessageContent | MessageSendOptions,
    players?: Ref<UserType>[],
    image?: MessageMedia
  ) {
    if (players && isDocumentArray(players)) {
      await Promise.all(
        players
          .filter((user) => user.phoneNumber !== this.chat.message.userNumber)
          .map(
            async (user) =>
              await this.chat.sendToOtherPerson(
                user.phoneNumber,
                message,
                image
              )
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
              await this.chat.sendToOtherPerson(
                user.phoneNumber,
                message,
                image
              )
          )
      );
    }
  }

  /**
   * Function for set game creator
   */
  async setCreatorId(id: Types.ObjectId) {
    this.game.gameCreatorID = id;
    await this.game.save();
  }

  /**
   * Function for set game winner
   */
  async setWinner(id: Types.ObjectId) {
    this.game.winner = id;
    await this.game.save();
  }

  /**
   * Function that will retrieve user next position
   * @param increment What it N-Position next player (default 1)
   * @returns User specific id document
   */
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

  /**
   * Function for retrieve elapsed since game started and ended
   * @returns Human readable elapsed time
   */
  getElapsedTime() {
    return calcElapsedTime(this.game.startTime!, this.game.endTime!);
  }

  /**
   * Function for retrieve if given player was already banned
   * @param _id Specific user id
   * @returns True or false boolean
   */
  isPlayerGotBanned(_id: Types.ObjectId) {
    return !!this.game.bannedPlayers?.find((player) => player._id.equals(_id));
  }

  /**
   * Get list of all players order id
   */
  get playersOrderIds() {
    return this.game.playersOrder;
  }

  /**
   * Get this game session unique id
   */
  get uid() {
    return this.game._id;
  }

  /**
   * Get this game session human readable id
   */
  get gameID() {
    return this.game.gameID;
  }

  /**
   * Get this game current position id
   */
  get currentPositionId() {
    return <Types.ObjectId>(<unknown>this.game.currentPosition);
  }

  /**
   * Get this game a time when it's created
   */
  get created_at() {
    return this.game.created_at;
  }

  /**
   * Get this game current state
   */
  get state() {
    return {
      WAITING: this.game.status === "WAITING",
      PLAYING: this.game.status === "PLAYING",
      ENDED: this.game.status === "ENDED",
    };
  }

  /**
   * Get if this game is not found
   */
  get NotFound() {
    return !this.game;
  }

  /**
   * Get this game human readable status
   */
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

  /**
   * Get all players of this game
   */
  get players() {
    return this.game.players;
  }

  /**
   * Get current card of this game
   */
  get currentCard() {
    return this.game.currentCard;
  }

  /**
   * Get user document that created this game
   */
  get creator() {
    return this.players!.find(
      (player) =>
        isDocument(player) && player._id.equals(this.game.gameCreatorID)
    );
  }

  /**
   * Get if current chatter is game creator or not
   */
  get isGameCreator() {
    return this.chat.user!._id.equals(this.game.gameCreatorID);
  }

  /**
   * Get current player user document
   */
  get currentPlayer() {
    return this.players!.find(
      (player) =>
        isDocument(player) && player._id.equals(this.game.currentPosition)
    );
  }

  /**
   * Get if current player is an author of this game
   */
  get currentPlayerIsAuthor() {
    return (
      isDocument(this.creator) &&
      this.creator?._id.equals(this.game.currentPosition)
    );
  }

  /**
   * Get this game winner player id if there is a winner
   */
  get winner() {
    return this.game.winner;
  }

  /**
   * Get if current chatter is it turn to play
   */
  get isCurrentChatTurn() {
    return this._isPlayerTurn(this.chat.user!);
  }
}
