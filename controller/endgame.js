import { requiredJoinGameSession } from "../lib/validator.js";

export default requiredJoinGameSession(async ({ chat, game }) => {
  if (!game) {
    await chat.replyToCurrentPerson("Game tidak ditemukan.");
    return false;
  } else if (game.isGameCreator) {
    if (!game.state.ENDING) {
      const copyPlayer = [...this.players];
      const copyCreator = Object.assign({}, game.creator)._doc;

      await game.endGame();

      await Promise.all([
        this.chat.sendToOtherPlayers(
          copyPlayer,
          `${copyCreator.userName} telah menghentikan permainan. Terimakasih sudah bermain!`
        ),
        this.chat.replyToCurrentPerson(
          "Game berhasil dihentikan. Terimakasih sudah bermain!"
        ),
      ]);
    } else {
      await chat.replyToCurrentPerson("Game sudah dihentikan!");
    }
  } else {
    await chat.replyToCurrentPerson("Kamu bukan orang yang membuat gamenya!");
  }
});
