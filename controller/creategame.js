import Game from "../models/game.js";

import { isGroupChat } from "../lib/processMessage.js";

export default async function creategame({
  client,
  from,
  id,
  user,
  message,
  logger,
}) {
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
}
