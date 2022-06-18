import type { proto, WASocket } from "@adiwajshing/baileys";
import { Logger } from "pino";

import { Chat } from "../lib/Chat";
import { emitHandler } from "./emitter";
import { getController } from "./controller";

export const messageHandler = async (sock: WASocket, logger: Logger) => {
  const controller = await getController();
  const emitter = emitHandler(controller);

  return async (WebMessage: proto.IWebMessageInfo) => {
    const PREFIX = process.env.PREFIX || "U#";
    const text = WebMessage!.message!.conversation;

    const command = text!
      .slice(PREFIX.length)!
      .trim()!
      .split(/ +/)!
      .shift()!
      .toLowerCase();

    const chat = new Chat(sock, WebMessage, logger);

    switch (command) {
      case "c":
      case "cg":
      case "create":
      case "creategame":
        emitter.emit("creategame", chat);
        break;
      case "s":
      case "sg":
      case "start":
      case "startgame":
        break;
      case "j":
      case "jg":
      case "join":
      case "joingame":
        break;
      case "i":
      case "ig":
      case "info":
      case "infogame":
        break;
      case "eg":
      case "end":
      case "endgame":
        break;

      case "l":
      case "lg":
      case "quit":
      case "leave":
      case "leavegame":
        break;
      case "p":
      case "play":
        break;
      case "say":
        break;
      case "cards":
        break;
      case "d":
      case "pickup":
      case "newcard":
      case "draw":
        break;

      default: {
        await chat.sendToCurrentPerson({
          text:
            command.length > 0
              ? `Tidak ada perintah yang bernama "${command}"`
              : "Under development",
        });
        break;
      }
    }
  };
};
