import { requiredJoinGameSession } from "../utils";
import { Card } from "../lib";

import type { allCard } from "../config/cards";

export default requiredJoinGameSession(async ({ chat, game, card }) => {
  const choosenCard = chat.args
    .join("")
    .trim()
    .replace(" ", "")
    .toLocaleLowerCase();

  if (game.isCurrentChatTurn) {
    if (chat.args.length < 1 || choosenCard === "") {
      await chat.replyToCurrentPerson({
        text: "Diperlukan kartu yang ingin dimainkan!",
      });
    } else if (!Card.isValidCard(choosenCard)) {
      await chat.replyToCurrentPerson({
        text: `${choosenCard} bukanlah sebuah kartu!`,
      });
    } else if (!card.isIncluded(choosenCard)) {
      await chat.replyToCurrentPerson({
        text: `Kamu tidak memiliki kartu ${choosenCard}!`,
      });
    } else {
      await card.solve(choosenCard as allCard);
    }
  } else {
    await chat.replyToCurrentPerson({ text: "Bukan giliranmu saat ini!" });
  }
});
