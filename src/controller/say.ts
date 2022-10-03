import { requiredJoinGameSession } from "../utils";

export default requiredJoinGameSession(async ({ chat, game }) => {
  const message = chat.args.join(" ");

  if (!game) {
    return await chat.replyToCurrentPerson(
      "Sebuah kesalahan, game tidak ditemukan!"
    );
  } else if (chat.args?.length < 1) {
    return await chat.replyToCurrentPerson(
      "Diperlukan pesan yang ingin dikirimkan!"
    );
  } else if (game.players!.length < 1) {
    return await chat.replyToCurrentPerson(
      "Tidak ada lawan bicara yang bisa diajak berkomunikasi."
    );
  } else if (message === "") {
    return await chat.replyToCurrentPerson("Pesan tidak boleh kosong!");
  }

  await game.sendToOtherPlayersWithoutCurrentPerson(
    `${chat.message.userName}: ${message}`
  );
  await chat.reactToCurrentPerson("👍");
});
