import { requiredJoinGameSession } from "../lib/validator.js";

export default requiredJoinGameSession(async ({ chat, game }) => {
  if (!game) {
    await chat.replyToCurrentPerson("Game tidak ditemukan.");
    return false;
  } else if (game.isGameCreator) {
    if (!game.state.ENDING) {
      await game.endGame();
    } else {
      await chat.replyToCurrentPerson("Game sudah dihentikan!");
    }
  } else {
    await chat.replyToCurrentPerson("Kamu bukan orang yang membuat gamenya!");
  }
});
