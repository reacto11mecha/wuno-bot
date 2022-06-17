import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
} from "@adiwajshing/baileys";
import { Boom } from "@hapi/boom";
import PQueue from "p-queue";
import dotenv from "dotenv";
import path from "path";
import P from "pino";

import { messageHandler } from "./handler/message";

dotenv.config();

export default class Bot {
  private queue = new PQueue({
    concurrency: 4,
    autoStart: false,
  });

  constructor() {
    this.queue.start();
  }

  private isMessageValid(message: string | null | undefined) {
    if (message) return message.startsWith(process.env.PREFIX || "U#");

    return false;
  }

  private async connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState(
      "auth_info_baileys"
    );

    const logger = P({
      transport: {
        targets: [
          {
            target: "pino-pretty",
            level: "debug",
            options: {
              colorize: true,
              ignore: "pid,hostname",
              translateTime: "SYS:standard",
            },
          },
          {
            target: "pino/file",
            level: "debug",
            options: {
              destination: path.join(__dirname, "..", "bot.log"),
            },
          },
        ],
      },
    });

    const sock = makeWASocket({
      logger,
      auth: state,
      printQRInTerminal: true,
    });

    const onMessageQueue = messageHandler(sock, logger);

    sock.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect } = update;

      switch (connection) {
        case "close": {
          const shouldReconnect =
            (lastDisconnect?.error as Boom)?.output?.statusCode !==
            DisconnectReason.loggedOut;

          logger.error(
            `Connection closed due to ${lastDisconnect?.error}, reconnecting ${shouldReconnect}`
          );

          if (shouldReconnect) {
            this.connectToWhatsApp();
          }

          break;
        }

        case "open": {
          logger.info("Opened connection");
          break;
        }

        default:
          break;
      }
    });

    sock.ev.on("messages.upsert", async (m) => {
      const pesan = m.messages[0];

      if (
        m.type === "notify" &&
        !pesan.key.fromMe &&
        pesan.key.remoteJid !== "status@broadcast" &&
        pesan?.message?.extendedTextMessage?.contextInfo?.remoteJid !==
          "status@broadcast"
      ) {
        if (this.isMessageValid(pesan?.message?.conversation)) {
          logger.info(`[Pesan] Ada pesan dari: ${pesan?.pushName}`);
          this.queue.add(() => onMessageQueue(pesan));
        }
      }
    });

    sock.ev.on("creds.update", saveCreds);
  }

  init() {
    this.connectToWhatsApp();
  }
}
