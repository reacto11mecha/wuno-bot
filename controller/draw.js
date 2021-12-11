import { requiredJoinGameSession } from "../lib/validator.js";

export default requiredJoinGameSession(async ({ chat, card, game }) => {
  if (game.state.WAITING) {
    await chat.replyToCurrentPerson("Sedang menunggu permainan dimulai!");
  } else if (game.state.ENDING) {
    await chat.replyToCurrentPerson("Game sudah selesai!");
  } else if (game.isCurrentChatTurn) {
    await card.drawToCurrentPlayer();
  } else {
    await chat.replyToCurrentPerson("Bukan giliranmu saat ini!");
  }
});
