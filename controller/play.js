import { requiredJoinGameSession } from "../lib/validator.js";
import { Card } from "../lib/index.js";

export default requiredJoinGameSession(async ({ chat, game, card }) => {
  const choosenCard = chat.args
    .join("")
    .trim()
    .replace(" ", "")
    .toLocaleLowerCase();

  if (game.currentPlayer._id.equals(chat.user._id)) {
    if (chat.args.length < 1 || choosenCard === "") {
      await chat.replyToCurrentPerson("Diperlukan kartu yang ingin dimainkan!");
      return false;
    } else if (!Card.isValidCard(choosenCard)) {
      await chat.replyToCurrentPerson(`${choosenCard} bukanlah sebuah kartu!`);
      return false;
    } else if (!card.isIncluded(choosenCard)) {
      await chat.replyToCurrentPerson(
        `Kamu tidak memiliki kartu ${choosenCard}!`
      );
      return false;
    }

    await card.solve(choosenCard);
  } else {
    await chat.replyToCurrentPerson("Bukan giliranmu saat ini!");
  }
});
