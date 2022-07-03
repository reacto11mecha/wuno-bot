import { atLeastGameID } from "../utils";

import { PREFIX } from "../config/prefix";

export default atLeastGameID(
  async ({ chat, game }) => {
    if (game.state.PLAYING) {
      return await chat.replyToCurrentPerson({
        text: "Game ini sedang bermain, konfirmasikan ke orang yang membuat game atau tunggu giliran selanjutnya!",
      });
    } else if (game.state.ENDED) {
      return await chat.replyToCurrentPerson({
        text: "Game ini sudah selesai!",
      });
    }

    await game.joinGame();

    await Promise.all([
      await chat.replyToCurrentPerson({
        text: `Berhasil join ke game "${game.gameID}", tunggu pembuat ruang game ini memulai permainannya!`,
      }),
      await game.sendToOtherPlayersWithoutCurrentPerson({
        text: `Pemain dengan username "${chat.message.userName}" memasuki ruang permainan! Sapa dia dengan menggunakan "${PREFIX}say Halo ${chat.message.userName}!"`,
      }),
    ]);
  },
  async ({ chat, game }) =>
    await chat.replyToCurrentPerson({
      text: `Kamu sudah masuk ke sesi game ${
        chat.isGroupChat ? "[REDACTED]" : game.gameID
      }`,
    })
);
