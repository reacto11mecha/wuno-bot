import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import PQueue from "p-queue";
import pLimit from "p-limit";
import dotenv from "dotenv";
import path from "path";
import P from "pino";

import { df as formatTime } from "./utils/index";
import { messageHandler } from "./handler/message";
import { connectDatabase } from "./handler/database";
import { PREFIX } from "./config/prefix";

dotenv.config();

export default class Bot {
  private logger = P({
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

  private queue = new PQueue({
    concurrency: 4,
    autoStart: false,
  });
  private messageLimitter = pLimit(8);
  private waClient: Client;

  constructor(clientId: string) {
    this.waClient = new Client({
      authStrategy: new LocalAuth({ clientId }),
    });

    this.waClient.on("qr", (qr) => qrcode.generate(qr, { small: true }));
    this.waClient.on("ready", () => {
      this.logger.info("[BOT] Siap digunakan");
      this.waClient.setStatus(
        `Ketik "${PREFIX}" untuk memulai percakapan! Dinyalakan pada ${formatTime(
          new Date()
        )}.`
      );
    });
    this.waClient.on("authenticated", () =>
      this.logger.info("[BOT] Berhasil melakukan proses autentikasi")
    );
    this.waClient.on("change_state", (state) =>
      this.logger.info(`[BOT] State bot berubah, saat ini: ${state}`)
    );

    this.queue.start();
  }

  /**
   * The main entrance gate for this bot is working
   */
  async init() {
    if (!process.env.MONGO_URI)
      throw new Error("[DB] Diperlukan sebuah URI MongDB | MONGO_URI");

    this.logger.info("[INIT] Inisialisasi bot");

    const onMessageQueue = await messageHandler(
      this.waClient,
      this.logger,
      this.messageLimitter
    );

    this.waClient.on("message", async (message) => {
      if (message.body.startsWith(PREFIX)) {
        const contact = await message.getContact();

        this.logger.info(`[Pesan] Ada pesan dari: ${contact.pushname}`);
        this.queue.add(async () => await onMessageQueue(message, contact));
      }
    });

    connectDatabase(process.env.MONGO_URI, this.logger).then(() => {
      this.logger.info("[BOT] Menyalakan bot");
      this.waClient.initialize();
    });
  }
}
