import { atLeastGameID, df, type commonCb } from "../utils";
import { UserModel } from "../models";
import { Game } from "../lib";

import { isDocument, isDocumentArray } from "@typegoose/typegoose";

const getReplied = async (game: Game) => {
  const mainTemplate = `Pemain yang sudah tergabung:
${game
  .players!.map((player) => isDocument(player) && `- ${player.userName}`)
  .join("\n")}`;

  switch (true) {
    case game.state.PLAYING:
      return `${mainTemplate}

Kartu Saat Ini: ${game.currentCard}
Giliran Pemain Saat Ini: ${
        isDocument(game.currentPlayer) ? game.currentPlayer.userName : ""
      }

Giliran Bermain:
${game
  .playersOrderIds!.map(
    (player, idx) =>
      isDocumentArray(game.players) &&
      `${idx + 1}. ${
        game.players!.find((user) => user._id.equals(player))!.userName
      }`
  )
  .join("\n")}`;

    case game.state.ENDED: {
      if (!game.winner)
        return "Permainan dihentikan tanpa ada seorang pemenang.";

      const winner = await UserModel.findById(game.winner);

      return `Durasi Permainan: ${game.getElapsedTime()}
Pemenang Permainan: ${winner ? winner.userName : "<USER TELAH DIHAPUS>"}`;
    }

    // Waiting
    default:
      return mainTemplate;
  }
};

const commonCallback: commonCb = async ({ chat, game }) => {
  const replied = await getReplied(game);

  await chat.replyToCurrentPerson(
    `GAME ID: ${game.gameID}
Game Status: ${game.translatedStatus}
Tanggal Dibuat: ${df(game.created_at!)}

${replied}`.trim()
  );
};

export default atLeastGameID(commonCallback, commonCallback);
