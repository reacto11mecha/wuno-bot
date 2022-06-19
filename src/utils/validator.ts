import { HydratedDocument } from "mongoose";

import GameModel from "../models/game";
import CardModel from "../models/card";

import { Chat } from "../lib/Chat";
import { Game } from "../lib/Game";
import { Card } from "../lib/Card";

type TypeReqJGS = (cb: { chat: Chat; game: Game; card: Card }) => Promise<void>;
export const requiredJoinGameSession =
  (cb: TypeReqJGS) => async (chat: Chat) => {
    try {
      if (chat.isJoiningGame) {
        const gameData = await GameModel.findOne({
          _id: chat.gameProperty!.gameUID,
          gameID: chat.gameProperty!.gameID,
        }).populate("players.user_id");

        const game = new Game(gameData!, chat);

        const cardData = await CardModel.findOne({
          game_id: game.id,
          user_id: chat.user!._id,
        });
        const card = new Card(cardData!, chat, game);

        return await cb({ chat, game, card });
      }

      await chat.replyToCurrentPerson({
        text: "Kamu belum masuk ke sesi game manapun!",
      });
    } catch (error) {
      chat.logger.error(error);
    }
  };
