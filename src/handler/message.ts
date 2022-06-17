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
