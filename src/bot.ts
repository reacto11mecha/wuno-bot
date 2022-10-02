import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import PQueue from "p-queue";
import pLimit from "p-limit";
import dotenv from "dotenv";
import path from "path";
import P from "pino";

import { messageHandler } from "./handler/message";
import { connectDatabase } from "./handler/database";
import { PREFIX } from "./config/prefix";

dotenv.config();

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

export default class Bot {
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
    this.waClient.on("ready", () => logger.info("[BOT] Siap digunakan"));
    this.waClient.on("authenticated", () =>
      logger.info("[BOT] Berhasil melakukan proses autentikasi")
    );
    this.waClient.on("change_state", (state) =>
      logger.info(`[BOT] State bot berubah, saat ini: ${state}`)
    );

    this.queue.start();

    this.queue.on("add", () =>
      logger.info(
        `[P-QUEUE] Task is added.  Size: ${this.queue.size}  Pending: ${this.queue.pending}`
      )
    );
    this.queue.on("active", () =>
      logger.info(
        `[P-QUEUE] Active Queue. Size: ${this.queue.size}  Pending: ${this.queue.pending}`
      )
    );
    this.queue.on("next", () =>
      logger.info(
        `[P-QUEUE] Task is completed.  Size: ${this.queue.size}  Pending: ${this.queue.pending}`
      )
    );
    this.queue.on("idle", () =>
      logger.info(
        `[P-QUEUE] Queue is idle.  Size: ${this.queue.size}  Pending: ${this.queue.pending}`
      )
    );
  }

  /**
   * The main entrance gate for this bot is working
   */
  async init() {
    if (!process.env.MONGO_URI)
      throw new Error("[DB] Diperlukan sebuah URI MongDB | MONGO_URI");

    logger.info("[INIT] Inisialisasi bot");

    const onMessageQueue = await messageHandler(
      this.waClient,
      logger,
      this.messageLimitter
    );

    this.waClient.on("message", async (message) => {
      if (message.body.startsWith(PREFIX)) {
        const contact = await message.getContact();

        logger.info(`[Pesan] Ada pesan dari: ${contact.pushname}`);
        this.queue.add(async () => await onMessageQueue(message, contact));
      }
    });

    connectDatabase(process.env.MONGO_URI, logger).then(() => {
      logger.info("[BOT] Menyalakan bot");
      this.waClient.initialize();
    });
  }
}
