import Game from "../models/game.js";

const _players = (game) => [...game.players.map(({ user_id }) => user_id)];
const _creator = (game, players) =>
  players.find(({ _id }) => game.gameCreatorID.equals(_id));
const _isGameCreator = (game, user) => game.gameCreatorID.equals(user._id);

const requiredJoinGameSession = (cb) => async (args) => {
  if (args.user.gameProperty.isJoiningGame) {
    const game = await Game.findOne({
      _id: args.user.gameProperty.gameUID,
      gameID: args.user.gameProperty.gameID,
    }).populate("players.user_id");

    const players = _players(game);
    const creator = _creator(game, players);

    const isGameCreator = _isGameCreator(game, args.user);

    return await cb({ ...args, game, players, creator, isGameCreator });
  } else {
    await args.client.simulateTyping(args.from, true);
    await args.client.reply(
      args.from,
      "Kamu belum masuk ke sesi game manapun!",
      args.id,
      true
    );
    await args.client.simulateTyping(args.from, false);
  }
};

const atLeastGameID = (cbNotJoiningGame, cbJoiningGame) => async (args) => {
  const gameID = args.args[0];

  if (!args.user.gameProperty.isJoiningGame) {
    if (!gameID || gameID === "") {
      await args.client.simulateTyping(args.from, true);
      await args.client.reply(
        args.from,
        "Diperlukan parameter game id!",
        args.id,
        true
      );
      await args.client.simulateTyping(args.from, false);
      return false;
    } else if (gameID.length < 11) {
      await args.client.simulateTyping(args.from, true);
      await args.client.reply(
        args.from,
        "Minimal panjang game id adalah 11 karakter!",
        args.id,
        true
      );
      await args.client.simulateTyping(args.from, false);
      return false;
    }

    const searchedGame = await Game.findOne({
      gameID,
    }).populate("players.user_id");

    const players = _players(searchedGame);
    const creator = _creator(searchedGame, players);

    const isGameCreator = _isGameCreator(searchedGame, args.user);

    if (!searchedGame) {
      await args.client.reply(
        args.from,
        "Game tidak ditemukan.",
        args.id,
        true
      );
      await args.client.simulateTyping(args.from, false);
      return false;
    }

    return await cbNotJoiningGame({
      ...args,
      searchedGame,
      players,
      creator,
      isGameCreator,
    });
  } else {
    const game = await Game.findOne({
      _id: args.user.gameProperty.gameUID,
      gameID: args.user.gameProperty.gameID,
    }).populate("players.user_id");

    const players = _players(game);
    const creator = _creator(game, players);

    const isGameCreator = _isGameCreator(game, args.user);

    return await cbJoiningGame({
      ...args,
      game,
      players,
      creator,
      isGameCreator,
    });
  }
};

export { requiredJoinGameSession, atLeastGameID };
