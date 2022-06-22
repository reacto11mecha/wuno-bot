import { databaseSource } from "../handler/database";
import { Chat, Game, Card } from "../lib";

import { Game as GameModel, Card as CardModel } from "../entity";

type TypeReqJGS = (cb: { chat: Chat; game: Game; card: Card }) => Promise<void>;
export const requiredJoinGameSession =
  (cb: TypeReqJGS) => async (chat: Chat) => {
    try {
      if (chat.isJoiningGame) {
        const gameData = await databaseSource.manager.findOneBy(
          GameModel,
          {
            id: chat.gameProperty!.gameUID,
            gameID: chat.gameProperty!.gameID,
          },
          { relations: { user: true } }
        );
        const game = new Game(gameData!, chat);

        const cardData = await databaseSource.manager.findOneBy(CardModel, {
          game_id: gameData!,
          user_id: chat.user!,
        });
        const card = new Card(cardData!, chat, game);

        console.log("Before callback");
        return await cb({ chat, game, card });
      }

      await chat.replyToCurrentPerson({
        text: "Kamu belum masuk ke sesi game manapun!",
      });
    } catch (error) {
      chat.logger.error(error);
    }
  };
