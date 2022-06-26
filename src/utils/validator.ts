import { Chat, Game, Card } from "../lib";

import { GameModel, CardModel } from "../models";

type TypeReqJGS = (cb: { chat: Chat; game: Game; card: Card }) => Promise<void>;
export const requiredJoinGameSession =
  (cb: TypeReqJGS) => async (chat: Chat) => {
    try {
      if (chat.isJoiningGame) {
        const gameData = await GameModel.findOne({
          id: chat.gameProperty!.gameUID,
          gameID: chat.gameProperty!.gameID,
        });
        const game = new Game(gameData!, chat);

        const cardData = await CardModel.findOne({
          game: gameData!._id,
          user: chat.user!._id,
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

export type commonCb = (cb: { chat: Chat; game: Game }) => Promise<void>;
export const atLeastGameID =
  (cbNotJoiningGame: commonCb, cbJoiningGame: commonCb) =>
  async (chat: Chat) => {
    try {
      const gameID = chat.args[0];

      if (!chat.isJoiningGame) {
        if (!gameID || gameID === "") {
          return await chat.replyToCurrentPerson({
            text: "Diperlukan parameter game id!",
          });
        } else if (gameID.length < 11) {
          return await chat.replyToCurrentPerson({
            text: "Minimal panjang game id adalah 11 karakter!",
          });
        }

        const searchedGame = await GameModel.findOne({
          gameID,
        });

        if (!searchedGame)
          return await chat.replyToCurrentPerson({
            text: "Game tidak ditemukan.",
          });

        const game = new Game(searchedGame!, chat);

        return await cbNotJoiningGame({
          chat,
          game,
        });
      }

      const gameData = await GameModel.findOne({
        _id: chat.gameProperty!.gameUID,
        gameID: chat.gameProperty!.gameID,
      });
      const game = new Game(gameData!, chat);

      return await cbJoiningGame({
        chat,
        game,
      });
    } catch (error) {
      chat.logger.error({ error });
    }
  };

export type isDMChatCb = (cb: Chat) => Promise<void>;
export const isDMChat = (cb: isDMChatCb) => async (chat: Chat) => {
  if (chat.isDMChat) return await cb(chat);

  await chat.replyToCurrentPerson({
    text: "Kirim pesan ini lewat DM WhatsApp!",
  });
};
