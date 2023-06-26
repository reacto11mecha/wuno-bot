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
  const choosenCard = chat.args
    .join("")
    .trim()
    .replace(" ", "")
    .toLocaleLowerCase();

  if (game.isCurrentChatTurn) {
    if (chat.args.length < 1 || choosenCard === "") {
      await chat.replyToCurrentPerson("Diperlukan kartu yang ingin dimainkan!");
    } else if (guessCardIsAlmostValidWildOrPlus4(choosenCard, card)) {
      await chat.replyToCurrentPerson(
        `Kamu memiliki kartu ${choosenCard} tetapi belum ada warnanya.

Coba tetapkan warna di antara warna \`\`\`red\`\`\` (merah), \`\`\`green\`\`\` (hijau), \`\`\`blue\`\`\` (biru), atau \`\`\`yellow\`\`\` (kuning) dengan menggunakan perintah

  \`\`\`${env.PREFIX}p ${choosenCard} <warna yang di inginkan>\`\`\``
      );
    } else if (!Card.isValidCard(choosenCard)) {
      await chat.replyToCurrentPerson(`${choosenCard} bukanlah sebuah kartu!`);
    } else if (!card.isIncluded(choosenCard)) {
      await chat.replyToCurrentPerson(
        `Kamu tidak memiliki kartu ${choosenCard}!`
      );
    } else {
      await card.solve(choosenCard as allCard);
    }
  } else {
    await chat.replyToCurrentPerson("Bukan giliranmu saat ini!");
  }
});
