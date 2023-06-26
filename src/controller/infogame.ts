import { atLeastGameID, df, type commonCb } from "../utils";
import { Game } from "../lib";

import { prisma } from "../handler/database";

const getReplied = async (game: Game) => {
  const players = await game.getAllPlayerUserObject();
  const currentPlayer = await game.getCurrentPlayerUserData();

  const mainTemplate = `Pemain yang sudah tergabung:
${players!.map((player) => `- ${player?.username}`).join("\n")}`;

  switch (true) {
    case game.state.PLAYING: {
      return `${mainTemplate}

Kartu Saat Ini: ${game.currentCard}
Giliran Pemain Saat Ini: ${
        game.currentPositionId ? currentPlayer?.username : ""
      }

Giliran Bermain:
${game
  .playersOrderIds!.map((player) => players.find((user) => user?.id === player))
  .map((player, idx) => `${idx + 1}. ${player?.username}`)
  .join("\n")}`;
    }

    case game.state.ENDED: {
      if (!game.winner)
        return "Permainan dihentikan tanpa ada seorang pemenang.";

      const winner = await prisma.user.findUnique({
        where: { id: game.winner },
      });

      return `Durasi Permainan: ${game.getElapsedTime()}
Pemenang Permainan: ${winner ? winner.username : "<USER TELAH DIHAPUS>"}`;
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
Tanggal Dibuat: ${df(game.created_at)}

${replied}`.trim()
  );
};

export default atLeastGameID(commonCallback, commonCallback);
