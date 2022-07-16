import { create, Client } from "@open-wa/wa-automate";
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

  constructor() {
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

  private async clientHandler(
    messageQueue: PQueue,
    messageLimitter: ReturnType<typeof pLimit>,
    client: Client
  ) {
    const onMessageQueue = await messageHandler(
      client,
      logger,
      messageLimitter
    );

    client.onStateChanged((state) => {
      logger.info(`[STATE] Current State: ${state}`);
      if (state === "CONFLICT" || state === "UNLAUNCHED") client.forceRefocus();
    });

    client.onMessage((message) => {
      if (message.body.startsWith(PREFIX)) {
        logger.info(`[Pesan] Ada pesan dari: ${message.sender.pushname}`);
        messageQueue.add(async () => await onMessageQueue(message));
      }
    });

    logger.info("[BOT] Bot berhasil dihidupkan | Pesan Pertama");
  }

  init() {
    if (!process.env.MONGO_URI)
      throw new Error("[DB] Diperlukan sebuah URI MongDB | MONGO_URI");

    connectDatabase(process.env.MONGO_URI, logger).then(() =>
      create({
        sessionId: "WUNO_BOT",
        authTimeout: 60,
        blockCrashLogs: true,
        disableSpins: true,
        headless: true,
        logConsole: false,
        popup: true,
        qrTimeout: 0,
      }).then((client) =>
        this.clientHandler(this.queue, this.messageLimitter, client)
      )
    );
  }
}
