import { requiredJoinGameSession } from "../utils";

export default requiredJoinGameSession(async ({ chat, game }) => {
  const message = chat.args.join(" ");

  if (!game) {
    return await chat.replyToCurrentPerson({
      text: "Sebuah kesalahan, game tidak ditemukan!",
    });
  } else if (chat.args?.length < 1) {
    return await chat.replyToCurrentPerson({
      text: "Diperlukan pesan yang ingin dikirimkan!",
    });
  } else if (game.players!.length < 1) {
    return await chat.replyToCurrentPerson({
      text: "Tidak ada lawan bicara yang bisa diajak berkomunikasi.",
    });
  } else if (message === "") {
    return await chat.replyToCurrentPerson({
      text: "Pesan tidak boleh kosong!",
    });
  }

  await game.sendToOtherPlayersWithoutCurrentPerson({
    text: `${chat.message.userName}: ${message}`,
  });
  await chat.sendToCurrentPerson({
    react: { text: "👍", key: chat.messageKey },
  });
});
