import { databaseSource } from "../handler/database";
import { Chat, Game, Card } from "../lib";

import { Game as GameModel, Card as CardModel } from "../entity";

type TypeReqJGS = (cb: { chat: Chat; game: Game; card: Card }) => Promise<void>;
export const requiredJoinGameSession =
  (cb: TypeReqJGS) => async (chat: Chat) => {
    try {
      console.log(chat.user);
      if (chat.isJoiningGame) {
        console.log("Joined");
        const gameData = await databaseSource.manager.findOneBy(GameModel, {
          // id: chat.gameProperty!.gameUID,
          // gameID: chat.gameProperty!.gameID,
          gameID: "xzb7Q01okHL",
        });
        const game = new Game(gameData!, chat);
        console.log(chat.gameProperty);
        console.log(gameData);
        // console.log(game);

        const cardData = await databaseSource.manager.findOneBy(CardModel, {
          game_id: game.id,
          user_id: chat.user!.id,
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
