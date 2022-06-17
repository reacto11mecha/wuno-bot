import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
} from "@adiwajshing/baileys";
import { Boom } from "@hapi/boom";
import path from "path";
import P from "pino";

export default class Bot {
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
      if (
        m.type === "notify" &&
        !m.messages[0].key.fromMe &&
        m.messages[0].key.remoteJid !== "status@broadcast"
      ) {
        console.log(JSON.stringify(m, null, 2));
      }
    });

    sock.ev.on("creds.update", saveCreds);
  }

  init() {
    this.connectToWhatsApp();
  }
}
