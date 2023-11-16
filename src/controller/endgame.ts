import { requiredJoinGameSession } from "../utils";

export default requiredJoinGameSession(async ({ chat, game }) => {
  if (game.NotFound) {
    await chat.replyToCurrentPerson("Game tidak ditemukan.");
  } else if (game.isGameCreator) {
    if (!game.state.ENDED) {
      const playerList = game.players.filter(
        (player) => player.playerId !== chat.user!.id,
      );

      const creator = await game.getCreatorUser();

      await game.endGame();

      await Promise.all([
        chat.replyToCurrentPerson(
          "Game berhasil dihentikan. Terimakasih sudah bermain!",
        ),
        game.sendToSpecificPlayerList(
          `${
            creator!.username
          } telah menghentikan permainan. Terimakasih sudah bermain!`,
          playerList,
        ),
      ]);
    } else {
      await chat.replyToCurrentPerson("Game sudah dihentikan!");
    }
  } else {
    await chat.replyToCurrentPerson("Kamu bukan orang yang membuat gamenya!");
  }
});
