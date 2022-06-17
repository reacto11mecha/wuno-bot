import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
} from "@adiwajshing/baileys";
import { Boom } from "@hapi/boom";

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });
  
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    
    switch (connection) {
      case "close": {
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        
        console.log(`Connection closed due to ${lastDisconnect?.error}, reconnecting ${shouldReconnect}`);

        if(shouldReconnect) {
           connectToWhatsApp();
        }

        break;
      }

      case "open": {
        console.log("Opened connection");
        break;
      }

      default:
        break;
    }
  });
  
  sock.ev.on("messages.upsert", async (m) => {
    console.log(JSON.stringify(m, null, 2));

    // console.log('replying to', m.messages[0].key.remoteJid)
    // await sock.sendMessage(m.messages[0].key.remoteJid!, { text: 'Hello there!' })
    // console.log(m);
  });

  sock.ev.on("creds.update", saveCreds);
}

connectToWhatsApp();
