import { requiredJoinGameSession } from "../lib/validator.js";

export default requiredJoinGameSession(async ({ chat, game }) => {
  const message = chat.args.join(" ");

  if (!game) {
    await chat.replyToCurrentPerson("Sebuah kesalahan, game tidak ditemukan!");
    return false;
  } else if (chat.args.length < 1) {
    await chat.replyToCurrentPerson("Diperlukan pesan yang ingin dikirimkan!");
    return false;
  } else if (game.players.length < 1) {
    await chat.replyToCurrentPerson(
      "Tidak ada lawan bicara yang bisa diajak berkomunikasi."
    );
    return false;
  } else if (message === "") {
    await chat.replyToCurrentPerson("Pesan tidak boleh kosong!");
    return false;
  }

  await chat.sendToOtherPlayers(game.players, `${chat.username}: ${message}`);
  await chat.replyToCurrentPerson("Pesan terkirim!");
});
