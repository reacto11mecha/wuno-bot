import EventEmitter from "events";
import {
  isDMChat as _dm,
  isGroupChat as _group,
} from "../lib/processMessage.js";

const _validatorBuilder = (checker, text) => (cb) => async (args) => {
  if (!checker(args.message)) {
    await args.client.reply(args.from, text, args.id, true);
    return false;
  }

  return await cb(args);
};

const isDMChat = _validatorBuilder(_dm, "Kirim pesan ini lewat DM WhatsApp !");
const isGroupChat = _validatorBuilder(
  _group,
  "Kirim pesan ini lewat Group Chat WhatsApp !"
);

export default function initEmitter() {
  const messageHandler = new EventEmitter();

  messageHandler.on("startgame", (args) => {});
  messageHandler.on("joingame", (args) => {});

  messageHandler.on(
    "leavegame",
    isDMChat((args) => {})
  );
  messageHandler.on(
    "play",
    isDMChat((args) => {})
  );
  messageHandler.on(
    "say",
    isDMChat((args) => {})
  );
  messageHandler.on(
    "cards",
    isDMChat((args) => {})
  );
  messageHandler.on(
    "draw",
    isDMChat((args) => {})
  );

  return messageHandler;
}
