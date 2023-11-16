import { requiredJoinGameSession, createCardsImageFront } from "../utils";

import type { allCard } from "../config/cards";

export default requiredJoinGameSession(async ({ chat, game, card }) => {
  if (game.state.WAITING) {
    await chat.replyToCurrentPerson("Sedang menunggu permainan dimulai!");
  } else if (game.state.ENDED) {
    await chat.replyToCurrentPerson("Game sudah selesai!");
  } else {
    const image = await createCardsImageFront(card.cards! as allCard[]);
    const cards = card.cards!.join(", ");

    await chat.replyToCurrentPerson(
      { caption: `Kartu kamu: ${cards}.` },
      image,
    );
  }
});
