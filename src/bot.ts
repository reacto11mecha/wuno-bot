import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import PQueue from "p-queue";
import pLimit from "p-limit";
import path from "path";
import P from "pino";

import { messageHandler } from "./handler/message";
import { df as formatTime } from "./utils/index";
import { prisma } from "./handler/database";
import { env } from "./env";

import type { Logger } from "pino";

export default class Bot {
  private logger: Logger;

  private queue = new PQueue({
    concurrency: 4,
    autoStart: false,
  });
  private messageLimitter = pLimit(8);
  private waClient: Client;

  constructor(clientId: string) {
    this.waClient = new Client({
      authStrategy: new LocalAuth({ clientId }),
      puppeteer: {
        executablePath: env.CHROME_PATH,
      },
    });

    this.logger = P({
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
              destination: path.join(__dirname, "..", `${clientId}-bot.log`),
            },
          },
        ],
      },
    });

    this.waClient.on("qr", (qr) => qrcode.generate(qr, { small: true }));
    this.waClient.on("ready", () => {
      this.logger.info("[BOT] Siap digunakan");
      this.waClient.setStatus(
        `Ketik "${
          env.PREFIX
        }" untuk memulai percakapan! Dinyalakan pada ${formatTime(
          new Date(),
        )}.`,
      );
    });
    this.waClient.on("authenticated", () =>
      this.logger.info("[BOT] Berhasil melakukan proses autentikasi"),
    );
    this.waClient.on("change_state", (state) =>
      this.logger.info(`[BOT] State bot berubah, saat ini: ${state}`),
    );

    this.queue.start();
  }

  /**
   * The main entrance gate for this bot is working
   */
  async init() {
    this.logger.info("[INIT] Inisialisasi bot");

    const onMessageQueue = await messageHandler(
      this.waClient,
      this.logger,
      this.messageLimitter,
    );

    this.waClient.on("message", async (message) => {
      if (message.body.startsWith(env.PREFIX)) {
        const contact = await message.getContact();

        this.logger.info(`[Pesan] Ada pesan dari: ${contact.pushname}`);
        this.queue.add(async () => await onMessageQueue(message, contact));
      }
    });

    prisma.$connect().then(() => {
      this.logger.info("[DB] Berhasil terhubung dengan database");
      this.logger.info("[BOT] Menyalakan bot");

      this.waClient.initialize();
    });
  }
}
