import { Chat, Game, Card } from "../lib";

import { GameModel, CardModel } from "../models";

/**
 * "requiredJoinGameSession" util callback controller type
 */
export type TypeReqJGS = (cb: {
  chat: Chat;
  game: Game;
  card: Card;
}) => Promise<void>;

/**
 * Util for checking user is joining game session before accessing main controller
 * @param cb Callback controller
 * @returns void
 */
export const requiredJoinGameSession =
  (cb: TypeReqJGS) => async (chat: Chat) => {
    try {
      if (chat.isJoiningGame) {
        const gameData = await GameModel.findById(chat.gameProperty!.gameUID);
        const game = new Game(gameData!, chat);

        const cardData = await CardModel.findOne({
          game: gameData!._id,
          user: chat.user!._id,
        });
        const card = new Card(cardData!, chat, game);

        return await cb({ chat, game, card });
      }

      await chat.replyToCurrentPerson("Kamu belum masuk ke sesi game manapun!");
    } catch (error) {
      chat.logger.error(error);
    }
  };

/**
 * "atLeastGameId" util callback not joining game and joining game
 */
export type commonCb = (cb: { chat: Chat; game: Game }) => Promise<void>;

/**
 * Util for grabbing game id from args and takes care if the game exists or not, either user is joining the game or not
 * @param cbNotJoiningGame Callback for not joining the game
 * @param cbJoiningGame Callback for the joining the game
 * @returns void
 */
export const atLeastGameID =
  (cbNotJoiningGame: commonCb, cbJoiningGame: commonCb) =>
  async (chat: Chat) => {
    try {
      const gameID = chat.args[0];

      if (!chat.isJoiningGame) {
        if (!gameID || gameID === "") {
          return await chat.replyToCurrentPerson(
            "Diperlukan parameter game id!"
          );
        } else if (gameID.length < 11) {
          return await chat.replyToCurrentPerson(
            "Minimal panjang game id adalah 11 karakter!"
          );
        }

        const searchedGame = await GameModel.findOne({
          gameID,
        });

        if (!searchedGame)
          return await chat.replyToCurrentPerson("Game tidak ditemukan.");

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

/**
 * "isDMChat" util callback type
 */
export type isDMChatCb = (cb: Chat) => Promise<void>;

/**
 * Util for checking whether the chat is coming from DM or not
 * @param cb General callback that can be passed basic chat instance
 * @returns void
 */
export const isDMChat = (cb: isDMChatCb) => async (chat: Chat) => {
  if (chat.isDMChat) return await cb(chat);

  await chat.replyToCurrentPerson("Kirim pesan ini lewat DM WhatsApp!");
};
