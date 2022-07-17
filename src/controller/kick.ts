import { requiredJoinGameSession } from "../utils";
import { isDocument } from "@typegoose/typegoose";

// This function is almost the same like leavegame controller
export default requiredJoinGameSession(async ({ chat, game }) => {
  if (!game.isGameCreator)
    return await chat.replyToCurrentPerson("Kamu bukan pembuat gamenya!");

  const message = chat.args.join(" ").trim();
  const player = game.players!.find(
    (player) => isDocument(player) && player.userName === message
  );

  if (isDocument(player)) {
    if (player._id.equals(chat.user!._id))
      return await chat.replyToCurrentPerson(
        "Kamu tidak bisa mengkick dirimu sendiri. Jika ingin keluar dari game gunakan perintah *leavegame*!"
      );

    await game.removeUserFromArray(player._id);

    if (game.state.PLAYING && game.players!.length < 2) {
      await game.endGame();

      await Promise.all([
        chat.sendToOtherPerson(
          player.phoneNumber,
          "Anda dikeluarkan dari permainan, tetapi karena pemain kurang dari dua orang maka game otomatis dihentikan. Terimakasih sudah bermain!"
        ),
        chat.sendToCurrentPerson(
          `Pemain ${player.userName} berhasil dikeluarkan dari permainan, tetapi karena pemain kurang dari dua orang maka game otomatis dihentikan. Terimakasih sudah bermain!`
        ),
      ]);

      return;
    }

    if (
      game.state.WAITING ||
      (game.state.PLAYING && !player._id.equals(game.currentPositionId))
    ) {
      await Promise.all([
        chat.sendToCurrentPerson(
          `Berhasil mengkick ${player.userName}. Sekarang dia tidak ada dalam permainan.`
        ),
        chat.sendToOtherPerson(
          player.phoneNumber,
          `Anda telah di kick oleh ${chat.message.userName}. Sekarang kamu keluar dari permainan.`
        ),
        game.sendToOtherPlayersWithoutCurrentPerson(
          `${player.userName} telah di kick oleh ${chat.message.userName}. Sekarang dia tidak ada lagi didalam permainan.`
        ),
      ]);
    } else if (
      game.state.PLAYING &&
      player._id.equals(game.currentPositionId)
    ) {
      await Promise.all([
        chat.sendToCurrentPerson(
          `Berhasil mengkick ${player.userName}. Sekarang dia tidak ada dalam permainan.`
        ),
        chat.sendToOtherPerson(
          player.phoneNumber,
          `Anda telah di kick oleh ${chat.message.userName}. Sekarang kamu keluar dari permainan.`
        ),
        game.sendToOtherPlayersWithoutCurrentPerson(
          `${player.userName} telah di kick oleh ${chat.message.userName}. Sekarang dia tidak ada lagi didalam permainan.`
        ),
      ]);
    }
  } else {
    await chat.replyToCurrentPerson(
      `Tidak ada pemain yang bernama "${message}"`
    );
  }
});
