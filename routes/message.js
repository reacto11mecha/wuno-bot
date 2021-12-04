import EventEmitter from "events";
import {
  isDMChat as _dm,
  isGroupChat as _group,
} from "../lib/processMessage.js";

import { controller } from "../lib/index.js";

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

  messageHandler.on("startgame", controller.startgame);
  messageHandler.on("joingame", controller.joingame);

  messageHandler.on("leavegame", isDMChat(controller.leavegame));
  messageHandler.on("play", isDMChat(controller.play));
  messageHandler.on("say", isDMChat(controller.say));
  messageHandler.on("cards", isDMChat(controller.cards));
  messageHandler.on("draw", isDMChat(controller.draw));

  return messageHandler;
}
