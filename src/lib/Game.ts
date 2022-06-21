import { Chat } from "./Chat";
import { databaseSource } from "../handler/database";

import { random } from "../utils";
import {
  Game as GameModel,
  // User as UserModel,
  // Card as CardModel,
} from "../entity";

// import type { allCard } from "../config/cards";
import type { AnyMessageContent } from "@adiwajshing/baileys";

export class Game {
  private game: GameModel;
  private chat: Chat;

  constructor(gameData: GameModel, chat: Chat) {
    this.game = gameData;
    this.chat = chat;
  }

  async startGame() {
    const shuffledPlayer = this.players
      .map((value) => ({ value, sort: random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
    const currentPlayer = shuffledPlayer[0];

    this.game.status = "PLAYING";
    this.game.startTime = new Date();
    this.game.playersOrder = shuffledPlayer;
    this.game.currentPosition = currentPlayer;

    await databaseSource.manager.save(this.game);
  }

  // async joinGame() {
  //   this.game.players.push({ user_id: this.chat.user!.id });
  //
  //   if (this.chat.user) {
  //     this.chat.user.gameProperty.isJoiningGame = true;
  //     this.chat.user.gameProperty.gameUID = this.game._id;
  //     this.chat.user.gameProperty.gameID = this.game.gameID;
  //   }
  //
  //   await Promise.all([databaseSource.manager.save(this.chat.user), databaseSource.manager.save(this.game)]);
  // }

  // async endGame() {
  //   const copyPlayer = [...this.players];
  //
  //   this.game.endTime = new Date();
  //   this.game.status = "ENDED";
  //   this.game.playersOrder = [];
  //   this.game.players = [];
  //
  //   await Promise.all(
  //     [...copyPlayer].map(async ({ _id }) => await this.leaveGameForUser(_id))
  //   );
  //
  //   await Promise.all([
  //     this.game.save(),
  //     CardModel.deleteMany({ game_id: this.id }),
  //   ]);
  // }
  //
  // async leaveGameForUser(_id: Types.ObjectId) {
  //   await UserModel.findOneAndUpdate(
  //     { _id },
  //     {
  //       gameProperty: {
  //         isJoiningGame: false,
  //       },
  //     }
  //   );
  // }
  //
  // async updatePosition(position: Types.ObjectId) {
  //   this.game.currentPosition = position;
  //
  //   await this.game.save();
  // }
  //
  // async updateCardAndPosition(card: allCard, position: Types.ObjectId) {
  //   this.game.currentCard = card;
  //   this.game.currentPosition = position;
  //
  //   await this.game.save();
  // }

  async sendToOtherPlayersWithoutCurrentPlayer(message: AnyMessageContent) {
    await Promise.all(
      this.players
        .filter((user) => user.phoneNumber !== this.chat.message.userNumber)
        .filter(({ id }) => id !== this.game.currentPosition.id)
        .map(
          async (user) =>
            await this.chat.sendToOtherPerson(user.phoneNumber, message)
        )
    );
  }

  // async removeUserFromArray(user: HydratedDocument<IUser>) {
  //   const removedFromPlayerOrder = [...this.game.playersOrder]
  //     .filter(({ _id }) => !_id.equals(user._id))
  //     .map(({ _id: user_id }) => ({ user_id }));
  //
  //   const removedFromPlayers = [...this.players]
  //     .filter(({ _id }) => !_id.equals(user._id))
  //     .map(({ _id }) => ({ user_id: _id }));
  //
  //   this.game.playersOrder = removedFromPlayerOrder;
  //   this.game.players = removedFromPlayers;
  //
  //   await Promise.all([
  //     this.leaveGameForUser(user._id),
  //     this.game.save(),
  //     CardModel.deleteOne({ user_id: user._id, game_id: this.id }),
  //   ]);
  // }
  //
  // async reversePlayerOrder() {
  //   const copyArray = [...this.game.playersOrder];
  //   const reversedArray = copyArray.reverse();
  //
  //   this.game.playersOrder = reversedArray;
  //   await this.game.save();
  // }
  //
  // _isPlayerTurn({ _id }: { _id: Types.ObjectId }) {
  //   return this.game.currentPosition.equals(_id);
  // }
  //
  // getNextPosition(increment = 1) {
  //   if (increment < 1) throw new Error("Invalid increment");
  //
  //   const playerOrder = [...this.game.playersOrder];
  //   const currentPlayer = this.currentPlayer;
  //
  //   const currentIndex = playerOrder.findIndex((player) =>
  //     player._id.equals(currentPlayer!._id)
  //   );
  //   const nextPlayerID =
  //     playerOrder[(currentIndex + increment) % playerOrder.length];
  //
  //   return this.players.find((player) => player._id.equals(nextPlayerID._id));
  // }
  //
  // get isCurrentChatTurn() {
  //   return this._isPlayerTurn(this.chat.user!);
  // }

  get gameInstance() {
    return this.game;
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

  get id() {
    return this.game.id;
  }

  get gameID() {
    return this.game.gameID;
  }

  get players() {
    return this.game.players;
  }

  get currentCard() {
    return this.game.currentCard;
  }

  get creator() {
    return this.players.find(({ id }) => this.game.gameCreatorID.id === id);
  }

  get isGameCreator() {
    return this.game.gameCreatorID.id === this.chat.user!.id;
  }

  get currentPlayer() {
    return this.players.find(({ id }) => this.game.currentPosition.id === id);
  }

  get currentPlayerIsAuthor() {
    return this.creator?.id === this.game.currentPosition.id;
  }
}
