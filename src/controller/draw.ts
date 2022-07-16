import { requiredJoinGameSession } from "../utils";

export default requiredJoinGameSession(async ({ chat, card, game }) => {
  if (game.state.WAITING) {
    await chat.replyToCurrentPerson("Sedang menunggu permainan dimulai!");
  } else if (game.state.ENDED) {
    await chat.replyToCurrentPerson("Game sudah selesai!");
  } else if (game.isCurrentChatTurn) {
    await card.drawToCurrentPlayer();
  } else {
    await chat.replyToCurrentPerson("Bukan giliranmu saat ini!");
  }
});
