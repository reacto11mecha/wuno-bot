import { requiredJoinGameSession } from "../utils";
import { Card } from "../lib";

import {
  regexValidWildColorOnly,
  regexValidWildColorPlus4Only,
} from "../config/cards";
import { env } from "../env";
import type { allCard } from "../config/cards";

const isValidWildOrPlus4 = (card: string) => {
  return (
    card.match(regexValidWildColorOnly) ||
    card.match(regexValidWildColorPlus4Only)
  );
};

const guessCardIsAlmostValidWildOrPlus4 = (card: string, cardLib: Card) => {
  return (
    card.includes("wild") &&
    !isValidWildOrPlus4(card) &&
    ["red", "green", "blue", "yellow"]
      .map((color) => `${card}${color}`)
      .every((guessedCard) => cardLib.isIncluded(guessedCard))
  );
};

export default requiredJoinGameSession(async ({ chat, game, card }) => {
  const choosenCards = chat.args.map((maybeACard) =>
    maybeACard.toLocaleLowerCase(),
  );

  if (game.isCurrentChatTurn) {
    if (choosenCards.length < 1) {
      return await chat.replyToCurrentPerson(
        "Cantumkan kartu yang ingin dimainkan!",
      );
    } else if (
      choosenCards.some((pieceCard) =>
        guessCardIsAlmostValidWildOrPlus4(pieceCard, card),
      )
    ) {
      const specialWild = choosenCards.find((pieceCard) =>
        guessCardIsAlmostValidWildOrPlus4(pieceCard, card),
      );

      return await chat.replyToCurrentPerson(
        `Kamu memiliki kartu ${specialWild} tetapi belum ada warnanya.
Coba tetapkan warna di antara warna \`\`\`red\`\`\` (merah), \`\`\`green\`\`\` (hijau), \`\`\`blue\`\`\` (biru), atau \`\`\`yellow\`\`\` (kuning) dengan menggunakan perintah

        \`\`\`${env.PREFIX}p ${specialWild}<warna yang di inginkan>\`\`\` (warna tidak di spasi)`,
      );
    } else if (choosenCards.some((pieceCard) => !Card.isValidCard(pieceCard))) {
      const invalidCards = choosenCards
        .filter((pieceCard) => !Card.isValidCard(pieceCard))
        .map((card) => `*${card}*`)
        .join(", ");

      return await chat.replyToCurrentPerson(
        `Kartu ${invalidCards} bukanlah sebuah kartu!`,
      );
    } else if (!card.isArrayIncluded(choosenCards)) {
      return await chat.replyToCurrentPerson(
        `Kamu tidak memiliki kartu ${choosenCards}!`,
      );
    }

    if (choosenCards.length < 2) {
      return await card.solve(choosenCards[0] as allCard);
    }

    await card.solveMany(choosenCards as allCard[]);
  } else {
    await chat.replyToCurrentPerson("Bukan giliranmu saat ini!");
  }
});
