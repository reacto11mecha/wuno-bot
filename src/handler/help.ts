import { Chat } from "../lib/Chat";
import { getController } from "./controller";

import { helpTemplate, replies } from "../config/messages";

/**
 * Help command handler function
 * @param controller Array of controllers object
 * @returns void
 */
export const handleHelpCommand =
  (controller: Awaited<ReturnType<typeof getController>>) =>
  async (chat: Chat) => {
    const commands = Object.keys(controller);

    const choosenCommand: string = chat.args
      .join("")
      .trim()
      .replace(" ", "")
      .toLocaleLowerCase();

    if (choosenCommand && !commands.includes(choosenCommand)) {
      await chat.sendToCurrentPerson(
        `Tidak ada perintah yang bernama "${choosenCommand}"`,
      );
    } else if (choosenCommand && commands.includes(choosenCommand)) {
      if (Object.keys(replies).includes(choosenCommand)) {
        await chat.sendToCurrentPerson(Object(replies)[choosenCommand]);
      }
    } else {
      await chat.sendToCurrentPerson(helpTemplate(commands));
    }
  };
