import { requiredJoinGameSession } from "../lib/validator.js";
import { Card } from "../lib/index.js";
import CardModel from "../models/card.js";

export default requiredJoinGameSession(
  async ({ client, from, id, user, game, players, args }) => {
    const _card = await CardModel.findOne({
      game_id: game._id,
      user_id: user._id,
    });

    const card = new Card(_card, user, game, players);
    const choosenCard = args
      .join("")
      .trim()
      .replace(" ", "")
      .toLocaleLowerCase();

    await client.simulateTyping(from, true);

    if (game.currentPosition.equals(user._id)) {
      if (args.length < 1 || choosenCard === "") {
        await client.reply(
          from,
          "Diperlukan kartu yang ingin dimainkan!",
          id,
          true
        );
        await client.simulateTyping(from, false);
        return false;
      } else if (!Card.isValidCard(choosenCard)) {
        await client.reply(
          from,
          `${choosenCard} bukanlah sebuah kartu!`,
          id,
          true
        );
        await client.simulateTyping(from, false);
        return false;
      }

      await card.solve(choosenCard);
      await client.reply(from, JSON.stringify(game), id, true);

      await client.simulateTyping(from, false);
    } else {
      await client.reply(from, "Bukan giliranmu saat ini!", id, true);
      await client.simulateTyping(from, false);
    }
  }
);
