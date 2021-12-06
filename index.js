import { create } from "@open-wa/wa-automate";
import PQueue from "p-queue";
import dotenv from "dotenv";
import pino from "pino";

import initDB from "./handler/database.js";

dotenv.config();
import handlerProc from "./handler/message.js";
import { _processMessage } from "./lib/index.js";

const logger = pino({
  transport: {
    targets: [
      {
        target: "pino-pretty",
        options: {
          colorize: true,
          ignore: "pid,hostname",
          translateTime: "SYS:standard",
        },
      },
      {
        target: "pino/file",
        options: {
          destination: new URL("./logs/bot.log", import.meta.url).pathname,
        },
      },
    ],
  },
});
const queue = new PQueue({
  concurrency: 4,
  autoStart: false,
});

initDB(process.env.MONGO_DB_CONNECTION_STRING, logger);

async function start(client) {
  try {
    logger.info("[BOT] Bot berhasil dihidupkan");

    const proc = await handlerProc(client);
    const onMessage = _processMessage(queue, proc, logger);

    const unreadMessages = await client.getAllUnreadMessages();
    unreadMessages?.forEach(onMessage);

    client.onStateChanged((state) => {
      logger.info(`[State] Current State: ${state}`);
      if (state === "CONFLICT") client.forceRefocus();
    });

    await client.onMessage(onMessage);
    queue.start();
  } catch (error) {
    console.error(error);
  }
}

create({
  sessionId: "UNO_BOT",
  cacheEnabled: false,
  authTimeout: 0,
  killProcessOnBrowserClose: true,
  qrTimeout: 0,
}).then(start);
