import { requiredJoinGameSession, createCardsImageFront } from "../utils";

import type { allCard } from "../config/cards";

export default requiredJoinGameSession(async ({ chat, game, card }) => {
  if (game.state.WAITING) {
    await chat.replyToCurrentPerson({
      text: "Sedang menunggu permainan dimulai!",
    });
  } else if (game.state.ENDED) {
    await chat.replyToCurrentPerson({ text: "Game sudah selesai!" });
  } else {
    const image = await createCardsImageFront(card.cards! as allCard[]);
    const cards = card.cards!.join(", ");

    await chat.replyToCurrentPerson({
      image,
      caption: `Kartu kamu: ${cards}.`,
    });
  }
});
