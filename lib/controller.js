import User from "../models/user.js";
import Game from "../models/game.js";

import shuffleArray from "../utils/shuffleArray.js";
import { isGroupChat } from "../lib/processMessage.js";

const formatDate = (date) => {
  const { timeZone } = Intl.DateTimeFormat().resolvedOptions();
  return date.toLocaleString("en-us", { timeZone });
};
const getTranslatedStatus = (status) => {
  switch (status) {
    case "WAITING":
      return "Menunggu Pemain";
    case "PLAYING":
      return "Sedang Bermain";
    case "ENDING":
      return "Selesai Bermain";
    default:
      return "N/A";
  }
};

export default {
  creategame: async ({ client, from, id, user, message, logger }) => {
    await client.simulateTyping(from, true);

    const gc = isGroupChat(message);

    if (!user.gameProperty.isJoiningGame) {
      const newGame = new Game({ gameCreatorID: user._id });
      newGame.players.push({ user_id: user._id });

      user.gameProperty.isJoiningGame = true;
      user.gameProperty.gameUID = newGame._id;
      user.gameProperty.gameID = newGame.gameID;

      await Promise.all([user.save(), newGame.save()]);

      logger.info(`[DB] Berhasil membuat sesi game baru | ${newGame.gameID}`);

      await client.reply(
        from,
        `Game berhasil dibuat.\nAjak teman kamu untuk bermain.\n\nPemain yang sudah tergabung\n- ${user.userName}\n\nKode: ${newGame.gameID}`,
        id,
        true
      );
      await client.reply(
        from,
        `${process.env.PREFIX}j ${newGame.gameID}`,
        id,
        true
      );

      await client.simulateTyping(from, false);
    } else {
      await client.reply(
        from,
        `Kamu sudah masuk ke sesi game: ${
          gc ? "[REDACTED]" : user.gameProperty.gameID
        }`,
        id,
        true
      );

      await client.simulateTyping(from, false);
    }
  },
  startgame: ({ client, from, id }) => {},
  joingame: async ({
    client,
    from,
    id,
    sender,
    args,
    user,
    message,
    userNumber,
  }) => {
    await client.simulateTyping(from, true);

    const gc = isGroupChat(message);
    const gameID = args[0];

    if (!user.gameProperty.isJoiningGame) {
      if (!gameID || gameID === "") {
        await client.reply(from, "Diperlukan parameter game id!", id, true);
        await client.simulateTyping(from, false);
        return false;
      } else if (gameID.length < 11) {
        await client.reply(
          from,
          "Minimal panjang game id adalah 11 karakter!",
          id,
          true
        );
        await client.simulateTyping(from, false);
        return false;
      }

      const searchedGame = await Game.findOne({
        gameID,
      });

      if (!searchedGame) {
        await client.reply(from, "Game tidak ditemukan.", id, true);
        await client.simulateTyping(from, false);
        return false;
      } else if (searchedGame.status === "PLAYING") {
        await client.reply(
          from,
          "Game ini sedang bermain, konfirmasikan ke orang yang membuat game atau tunggu giliran selanjutnya!",
          id,
          true
        );
        await client.simulateTyping(from, false);
        return false;
      } else if (searchedGame.status === "ENDING") {
        await client.reply(from, "Game ini sudah selesai!", id, true);
        await client.simulateTyping(from, false);
        return false;
      }

      searchedGame.players.push({ user_id: user._id });

      user.gameProperty.isJoiningGame = true;
      user.gameProperty.gameUID = searchedGame._id;
      user.gameProperty.gameID = searchedGame.gameID;

      await Promise.all([user.save(), searchedGame.save()]);

      await client.reply(
        from,
        `Berhasil join ke game "${gameID}", tunggu pembuat ruang game ini memulai permainannya!`,
        id,
        true
      );
      await client.simulateTyping(from, false);

      const sendTo = await Game.findOne({ _id: searchedGame._id })
        .populate("players.user_id")
        .then((e) =>
          e.players
            .filter(({ user_id: user }) => user.phoneNumber !== userNumber)
            .map(
              ({ user_id: user }) => `${user.phoneNumber.replace("+", "")}@c.us`
            )
        );

      sendTo.forEach(async (toSender) => {
        await client.simulateTyping(toSender, true);
        await client.sendText(
          toSender,
          `Pemain dengan username "${sender.pushname}" memasuki ruang permainan! Sapa dia dengan menggunakan "U#say Halo ${sender.pushname}!"`
        );
        await client.simulateTyping(toSender, false);
      });
    } else {
      await client.reply(
        from,
        `Kamu sudah masuk ke sesi game ${
          gc ? "[REDACTED]" : user.gameProperty.gameID
        }\n`,
        id,
        true
      );

      await client.simulateTyping(from, false);
    }
  },
  infogame: async ({ client, from, id, args, user }) => {
    await client.simulateTyping(from, true);

    let game;
    const gameID = args[0];

    if (!user.gameProperty.isJoiningGame) {
      if (!gameID || gameID === "") {
        await client.reply(from, "Diperlukan parameter game id!", id, true);
        await client.simulateTyping(from, false);
        return false;
      } else if (gameID.length < 11) {
        await client.reply(
          from,
          "Minimal panjang game id adalah 11 karakter!",
          id,
          true
        );
        await client.simulateTyping(from, false);
        return false;
      }

      game = await Game.findOne({
        gameID,
      }).populate("players.user_id");
    } else {
      game = await Game.findOne({
        _id: user.gameProperty.gameUID,
        gameID: user.gameProperty.gameID,
      }).populate("players.user_id");
    }

    if (!game) {
      await client.reply(from, "Game tidak ditemukan.", id, true);
      await client.simulateTyping(from, false);
      return false;
    }

    const status = getTranslatedStatus(game.status);

    await client.reply(
      from,
      `Game ID: ${
        game.gameID
      }\nGame Status: ${status}\nTanggal Dibuat: ${formatDate(
        game.startTime
      )}\n\nPemain yang sudah tergabung:\n${game.players
        .map((g) => `- ${g.user_id.userName}`)
        .join("\n")}`,
      id,
      true
    );
    await client.simulateTyping(from, false);
  },
  endgame: async ({ client, from, id, args, user, userNumber }) => {
    await client.simulateTyping(from, true);

    if (user.gameProperty.isJoiningGame) {
      const game = await Game.findOne({
        _id: user.gameProperty.gameUID,
        gameID: user.gameProperty.gameID,
      }).populate("players.user_id");

      if (!game) {
        await client.reply(from, "Game tidak ditemukan.", id, true);
        await client.simulateTyping(from, false);
        return false;
      } else if (game.gameCreatorID.equals(user._id)) {
        const players = [...game.players.map(({ user_id }) => user_id)];
        const creator = players.find(({ _id }) =>
          game.gameCreatorID.equals(_id)
        );

        game.endTime = Date.now();
        game.status = "ENDING";
        game.playerOrder = [];

        await Promise.all(
          [...players].map(
            async ({ _id }) =>
              await User.findOneAndUpdate(
                { _id },
                {
                  gameProperty: {
                    isJoiningGame: false,
                  },
                }
              )
          )
        );

        game.players = [];
        await game.save();

        await Promise.all([
          ...[...players]
            .filter((user) => user.phoneNumber !== userNumber)
            .map((user) => `${user.phoneNumber.replace("+", "")}@c.us`)
            .map(async (toSender) => {
              await client.simulateTyping(toSender, true);
              await client.sendText(
                toSender,
                `${creator.userName} telah menghentikan permainan. Terimakasih sudah bermain!`
              );
              await client.simulateTyping(toSender, false);
            }),
          client.reply(
            from,
            "Game berhasil dihentikan. Terimakasih sudah bermain!",
            id,
            true
          ),
        ]);

        await client.simulateTyping(from, false);
      } else {
        await client.simulateTyping(from, true);
        await client.reply(
          from,
          "Kamu bukan orang yang membuat gamenya!",
          id,
          true
        );
        await client.simulateTyping(from, true);
      }
    }
  },

  leavegame: ({ client, from, id }) => {},
  play: ({ client, from, id }) => {},
  say: async ({ client, from, id, args, user, userNumber }) => {
    await client.simulateTyping(from, true);

    if (!user.gameProperty.isJoiningGame) {
      await client.reply(
        from,
        "Kamu belum masuk ke sesi game manapun!",
        id,
        true
      );
      await client.simulateTyping(from, false);
      return false;
    } else if (!args || args === "") {
      await client.reply(
        from,
        "Diperlukan pesan yang ingin dikirimkan!",
        id,
        true
      );
      await client.simulateTyping(from, false);
      return false;
    }

    const message = args.join(" ");
    const game = await Game.findOne({
      _id: user.gameProperty.gameUID,
      gameID: user.gameProperty.gameID,
    }).populate("players.user_id");

    if (!game) {
      await client.reply(
        from,
        "Sebuah kesalahan, game tidak ditemukan!",
        id,
        true
      );
      await client.simulateTyping(from, false);
      return false;
    }

    const players = game.players.map(({ user_id }) => user_id);
    const sender = players.find(
      ({ phoneNumber }) => phoneNumber === userNumber
    );

    await Promise.all(
      players
        .filter((user) => user.phoneNumber !== userNumber)
        .map((user) => `${user.phoneNumber.replace("+", "")}@c.us`)
        .map(async (toSender) => {
          await client.simulateTyping(toSender, true);
          await client.sendText(toSender, `${sender.userName}: ${message}`);
          await client.simulateTyping(toSender, false);
        })
    );

    await client.reply(from, "Pesan terkirim!", id, true);
    await client.simulateTyping(from, false);
  },
  cards: ({ client, from, id }) => {},
  draw: ({ client, from, id }) => {},
};
