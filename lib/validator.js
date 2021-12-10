import GameModel from "../models/game.js";
import CardModel from "../models/card.js";

import { Game, Card } from "../lib/index.js";

const requiredJoinGameSession = (cb) => async (chat) => {
  if (chat.isJoiningGame) {
    const gameData = await GameModel.findOne({
      _id: chat.gameProperty.gameUID,
      gameID: chat.gameProperty.gameID,
    }).populate("players.user_id");

    const game = new Game(gameData, chat);

    const cardData = await CardModel.findOne({
      game_id: game.game._id,
      user_id: chat.user._id,
    });
    const card = new Card(cardData, chat, game);

    return await cb({ chat, game, card });
  }

  await chat.replyToCurrentPerson("Kamu belum masuk ke sesi game manapun!");
};

const atLeastGameID = (cbNotJoiningGame, cbJoiningGame) => async (chat) => {
  const gameID = chat.args[0];

  if (!chat.isJoiningGame) {
    if (!gameID || gameID === "") {
      await chat.replyToCurrentPerson("Diperlukan parameter game id!");
      return false;
    } else if (gameID.length < 11) {
      await chat.replyToCurrentPerson(
        "Minimal panjang game id adalah 11 karakter!"
      );
      return false;
    }

    const searchedGame = await GameModel.findOne({
      gameID,
    }).populate("players.user_id");

    if (!searchedGame) {
      await chat.replyToCurrentPerson("Game tidak ditemukan.");
      return false;
    }

    const game = new Game(searchedGame, chat);

    return await cbNotJoiningGame({
      chat,
      game,
    });
  }

  const gameData = await GameModel.findOne({
    _id: chat.gameProperty.gameUID,
    gameID: chat.gameProperty.gameID,
  }).populate("players.user_id");
  const game = new Game(gameData, chat);

  return await cbJoiningGame({
    chat,
    game,
  });
};

export { requiredJoinGameSession, atLeastGameID };
