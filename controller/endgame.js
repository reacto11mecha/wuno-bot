import Game from "../models/game.js";
import User from "../models/user.js";

export default async function endgame({ client, from, id, user, userNumber }) {
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
      if (game.status !== "ENDING") {
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
}
