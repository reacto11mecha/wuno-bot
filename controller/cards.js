import { requiredJoinGameSession } from "../lib/validator.js";

export default requiredJoinGameSession(async ({ chat, game, card }) => {
  if (game.state.WAITING) {
    await chat.replyToCurrentPerson("Sedang menunggu permainan dimulai!");
  } else if (game.state.ENDING) {
    await chat.replyToCurrentPerson("Game sudah selesai!");
  } else if (game.isCurrentChatTurn) {
    const cards = card.cards.join(", ");

    await chat.replyToCurrentPerson(`Kartu kamu: ${cards}.`);
  }
});
