import { requiredJoinGameSession } from "../utils";

export default requiredJoinGameSession(async ({ chat, game }) => {
  const message = chat.args.join(" ");

  if (!game) {
    return await chat.replyToCurrentPerson(
      "Sebuah kesalahan, game tidak ditemukan!"
    );
  } else if (game.players!.length < 1) {
    return await chat.replyToCurrentPerson(
      "Tidak ada lawan bicara yang bisa diajak berkomunikasi."
    );
  }

  const playerList = game.players.filter(
    (player) => player.playerId !== chat.user!.id
  );

  const { hasQuotedMessage, quotedMessage, quotedMessageMedia } =
    await chat.hasQuotedMessageMedia();

  if (hasQuotedMessage && quotedMessageMedia) {
    // If the quoted message is a gif
    if (quotedMessage.isGif) {
      await game.sendToSpecificPlayerList(
        {
          sendVideoAsGif: true,
          caption:
            message === ""
              ? `${chat.message.userName} telah mengirim sticker`
              : `${chat.message.userName}: ${message}`,
        },
        playerList,
        quotedMessageMedia
      );

      await chat.reactToCurrentPerson("👍");

      return;
    }

    if (!quotedMessageMedia.mimetype.startsWith("image/")) {
      // Check if it's not an image
      await chat.replyToCurrentPerson(
        "Pesan yang di kutip bukan sebuah gambar!"
      );

      return;
    }

    // It's a sticker
    if (
      quotedMessageMedia.mimetype === "image/webp" &&
      quotedMessage.body === ""
    ) {
      await game.sendToSpecificPlayerList(
        { sendMediaAsSticker: true },
        playerList,
        quotedMessageMedia
      );

      await game.sendToSpecificPlayerList(
        message === ""
          ? `${chat.message.userName} telah mengirim sticker`
          : `${chat.message.userName}: ${message}`,
        playerList
      );

      await chat.reactToCurrentPerson("👍");

      return;
    }

    await game.sendToSpecificPlayerList(
      {
        caption:
          message === ""
            ? `Gambar dari ${chat.message.userName}`
            : `${chat.message.userName}: ${message}`,
      },
      playerList,
      quotedMessageMedia
    );

    await chat.reactToCurrentPerson("👍");

    return;
  }

  if (message === "") {
    await chat.replyToCurrentPerson("Pesan tidak boleh kosong!");
    return;
  }

  await game.sendToSpecificPlayerList(
    `${chat.message.userName}: ${message}`,
    playerList
  );

  await chat.reactToCurrentPerson("👍");
});
