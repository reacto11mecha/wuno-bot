import { requiredJoinGameSession } from "../utils";

export default requiredJoinGameSession(async ({ chat, game }) => {
  if (!game.isGameCreator)
    return await chat.replyToCurrentPerson("Kamu bukan pembuat gamenya!");

  const message = chat.args.join(" ").trim();
  const players = await game.getAllPlayerUserObject();

  const player = players.find((player) => player?.username === message);

  if (message === "")
    return await chat.replyToCurrentPerson("Sebutkan siapa yang ingin di ban!");

  if (player) {
    if (player.id === chat.user!.id)
      return await chat.replyToCurrentPerson(
        "Kamu tidak bisa menge-ban dirimu sendiri. Jika ingin keluar dari game gunakan perintah *leavegame*!"
      );

    await game.removeUserFromArray(player.id);
    await game.addUserToBannedList(player.id);

    switch (true) {
      case game.state.PLAYING && game.players!.length < 2: {
        await game.endGame();

        await Promise.all([
          chat.sendToOtherPerson(
            player.phoneNumber,
            "Anda di banned dari permainan, tetapi karena pemain kurang dari dua orang maka game otomatis dihentikan. Terimakasih sudah bermain!"
          ),
          chat.sendToCurrentPerson(
            `Pemain ${player.username} berhasil di banned dari permainan, tetapi karena pemain kurang dari dua orang maka game otomatis dihentikan. Terimakasih sudah bermain!`
          ),
        ]);

        break;
      }

      case game.state.WAITING ||
        (game.state.PLAYING && player.id !== game.currentPositionId): {
        await Promise.all([
          chat.sendToCurrentPerson(
            `Berhasil menge-ban ${player.username}. Sekarang dia tidak ada dalam permainan.`
          ),
          chat.sendToOtherPerson(
            player.phoneNumber,
            `Anda telah di banned oleh ${chat.message.userName}. Sekarang kamu keluar dari permainan.`
          ),
          game.sendToOtherPlayersWithoutCurrentPerson(
            `${player.username} telah di banned oleh ${chat.message.userName}. Sekarang dia tidak ada lagi didalam permainan.`
          ),
        ]);

        break;
      }

      case game.state.PLAYING && player.id === game.currentPositionId: {
        await Promise.all([
          chat.sendToCurrentPerson(
            `Berhasil menge-ban ${player.username}. Sekarang dia tidak ada dalam permainan.`
          ),
          chat.sendToOtherPerson(
            player.phoneNumber,
            `Anda telah di banned oleh ${chat.message.userName}. Sekarang kamu keluar dari permainan.`
          ),
          game.sendToOtherPlayersWithoutCurrentPerson(
            `${player.username} telah di banned oleh ${chat.message.userName}. Sekarang dia tidak ada lagi didalam permainan.`
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
