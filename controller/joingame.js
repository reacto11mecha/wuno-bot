import { atLeastGameID } from "../lib/validator.js";

export default atLeastGameID(
  async ({ chat, game }) => {
    if (game.state.PLAYING) {
      await chat.replyToCurrentPerson(
        "Game ini sedang bermain, konfirmasikan ke orang yang membuat game atau tunggu giliran selanjutnya!"
      );
      return false;
    } else if (game.state.ENDING) {
      await chat.replyToCurrentPerson("Game ini sudah selesai!");
      return false;
    }

    await game.joinGame();

    await Promise.all([
      await chat.replyToCurrentPerson(
        `Berhasil join ke game "${game.game.gameID}", tunggu pembuat ruang game ini memulai permainannya!`
      ),
      await chat.sendToOtherPlayers(
        game.players,
        `Pemain dengan username "${chat.username}" memasuki ruang permainan! Sapa dia dengan menggunakan "U#say Halo ${chat.username}!"`
      ),
    ]);
  },
  async ({ chat, game }) =>
    await chat.replyToCurrentPerson(
      `Kamu sudah masuk ke sesi game ${
        chat.isGroupChat ? "[REDACTED]" : game.gameID
      }`
    )
);
