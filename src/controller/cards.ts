import { requiredJoinGameSession } from "../utils";

export default requiredJoinGameSession(async ({ chat, game, card }) => {
  if (game.state.WAITING) {
    await chat.replyToCurrentPerson({
      text: "Sedang menunggu permainan dimulai!",
    });
  } else if (game.state.ENDED) {
    await chat.replyToCurrentPerson({ text: "Game sudah selesai!" });
  } else if (game.isCurrentChatTurn) {
    const cards = card.cards!.join(", ");

    await chat.replyToCurrentPerson({ text: `Kartu kamu: ${cards}.` });
  }
});
