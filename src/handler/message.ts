import type { Client, Contact, Message } from "whatsapp-web.js";
import pLimit from "p-limit";
import { Logger } from "pino";

import { Chat } from "../lib/Chat";
import { emitHandler } from "./emitter";
import { PREFIX } from "../config/prefix";
import { getController } from "./controller";

import { botInfo } from "../config/messages";

/**
 * A "bone" for this bot handling incoming messages whatsoever
 * @param client whatsapp-web.js client instance
 * @param logger pino logger instance
 * @param limitter p-limit instance
 * @returns A function that can be used for queue callback
 */
export const messageHandler = async (
  client: Client,
  logger: Logger,
  limitter: ReturnType<typeof pLimit>
) => {
  const controller = await getController();
  const emitter = emitHandler(controller);

  return async (message: Message, contact: Contact) => {
    const command = message.body
      .slice(PREFIX.length)!
      .trim()!
      .split(/ +/)!
      .shift()!
      .toLowerCase();

    const chat = new Chat(client, message, logger, limitter, contact);

    switch (command) {
      case "cg":
      case "create":
      case "creategame":
        emitter.emit("creategame", chat);
        break;
      case "sg":
      case "start":
      case "startgame":
        emitter.emit("startgame", chat);
        break;
      case "j":
      case "jg":
      case "join":
      case "joingame":
        emitter.emit("joingame", chat);
        break;
      case "i":
      case "ig":
      case "info":
      case "infogame":
        emitter.emit("infogame", chat);
        break;
      case "eg":
      case "end":
      case "endgame":
        emitter.emit("endgame", chat);
        break;

      case "l":
      case "lg":
      case "quit":
      case "leave":
      case "leavegame":
        emitter.emit("leavegame", chat);
        break;
      case "p":
      case "play":
        emitter.emit("play", chat);
        break;
      case "s":
      case "say":
        emitter.emit("say", chat);
        break;
      case "c":
      case "cards":
        emitter.emit("cards", chat);
        break;
      case "d":
      case "pickup":
      case "newcard":
      case "draw":
        emitter.emit("draw", chat);
        break;
      case "k":
      case "kick":
        emitter.emit("kick", chat);
        break;
      case "b":
      case "ban":
        emitter.emit("ban", chat);
        break;
      case "h":
      case "help":
        emitter.emit("help", chat);
        break;

      default: {
        await chat.sendToCurrentPerson(
          command.length > 0
            ? `Tidak ada perintah yang bernama "${command}"`
            : botInfo
        );
        break;
      }
    }
  };
};
