import type { proto, WASocket } from "@adiwajshing/baileys";
import pino, { Logger } from "pino";

export const messageHandler =
  (sock: WASocket, logger: Logger) =>
  async (WebMessage: proto.IWebMessageInfo) => {
    const PREFIX = process.env.PREFIX || "U#";
    const text = WebMessage!.message!.conversation;

    const command = text!
      .slice(PREFIX.length)!
      .trim()!
      .split(/ +/)!
      .shift()!
      .toLowerCase();

    switch (command) {
      case "c":
      case "cg":
      case "create":
      case "creategame":
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
        await sock.sendMessage(WebMessage.key.remoteJid!, {
          text:
            command.length > 0
              ? `Tidak ada perintah yang bernama "${command}"`
              : "Under development",
        });
        break;
      }
    }
  };
