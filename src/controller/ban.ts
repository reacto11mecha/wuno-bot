import { requiredJoinGameSession } from "../utils";
import { isDocument } from "@typegoose/typegoose";

export default requiredJoinGameSession(async ({ chat, game }) => {
  if (!game.isGameCreator)
    return await chat.replyToCurrentPerson("Kamu bukan pembuat gamenya!");

  const message = chat.args.join(" ").trim();
  const player = game.players!.find(
    (player) => isDocument(player) && player.userName === message
  );

  if (message === "")
    return await chat.replyToCurrentPerson("Sebutkan siapa yang ingin di ban!");

  if (isDocument(player)) {
    if (player._id.equals(chat.user!._id))
      return await chat.replyToCurrentPerson(
        "Kamu tidak bisa menge-ban dirimu sendiri. Jika ingin keluar dari game gunakan perintah *leavegame*!"
      );

    await game.removeUserFromArray(player._id);
    await game.addUserToBannedList(player._id);

    switch (true) {
      case game.state.PLAYING && game.players!.length < 2: {
        await game.endGame();

        await Promise.all([
          chat.sendToOtherPerson(
            player.phoneNumber,
            "Anda di banned dari permainan, tetapi karena pemain kurang dari dua orang maka game otomatis dihentikan. Terimakasih sudah bermain!"
          ),
          chat.sendToCurrentPerson(
            `Pemain ${player.userName} berhasil di banned dari permainan, tetapi karena pemain kurang dari dua orang maka game otomatis dihentikan. Terimakasih sudah bermain!`
          ),
        ]);

        break;
      }

      case game.state.WAITING ||
        (game.state.PLAYING && !player._id.equals(game.currentPositionId)): {
        await Promise.all([
          chat.sendToCurrentPerson(
            `Berhasil menge-ban ${player.userName}. Sekarang dia tidak ada dalam permainan.`
          ),
          chat.sendToOtherPerson(
            player.phoneNumber,
            `Anda telah di banned oleh ${chat.message.userName}. Sekarang kamu keluar dari permainan.`
          ),
          game.sendToOtherPlayersWithoutCurrentPerson(
            `${player.userName} telah di banned oleh ${chat.message.userName}. Sekarang dia tidak ada lagi didalam permainan.`
          ),
        ]);

        break;
      }

      case game.state.PLAYING && player._id.equals(game.currentPositionId): {
        await Promise.all([
          chat.sendToCurrentPerson(
            `Berhasil menge-ban ${player.userName}. Sekarang dia tidak ada dalam permainan.`
          ),
          chat.sendToOtherPerson(
            player.phoneNumber,
            `Anda telah di banned oleh ${chat.message.userName}. Sekarang kamu keluar dari permainan.`
          ),
          game.sendToOtherPlayersWithoutCurrentPerson(
            `${player.userName} telah di banned oleh ${chat.message.userName}. Sekarang dia tidak ada lagi didalam permainan.`
          ),
        ]);

        break;
      }
    }
  } else {
    await chat.replyToCurrentPerson(
      `Tidak ada pemain yang bernama "${message}"`
    );
  }
});
