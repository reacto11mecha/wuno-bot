import User from "../models/user.js";
import Card from "../models/card.js";

import { requiredJoinGameSession } from "../lib/validator.js";

export default requiredJoinGameSession(
  async ({
    client,
    from,
    id,
    creator,
    userNumber,
    game,
    isGameCreator,
    players,
  }) => {
    await client.simulateTyping(from, true);

    if (!game) {
      await client.reply(from, "Game tidak ditemukan.", id, true);
      await client.simulateTyping(from, false);
      return false;
    } else if (isGameCreator) {
      if (game.status !== "ENDING") {
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

        await Promise.all([
          game.save(),
          Card.deleteMany({ game_id: game._id }),
        ]);

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
        await client.reply(from, "Game sudah dihentikan!", id, true);
        await client.simulateTyping(from, true);
      }
    } else {
      await client.reply(
        from,
        "Kamu bukan orang yang membuat gamenya!",
        id,
        true
      );
      await client.simulateTyping(from, true);
    }
  }
);
