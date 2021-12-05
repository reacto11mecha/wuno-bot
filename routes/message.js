import EventEmitter from "events";

import { controller } from "../lib/index.js";
import { isDMChat, findOrCreateUser } from "../utils/userHandler.js";

export default function initEmitter() {
  const messageHandler = new EventEmitter();

  messageHandler.on("creategame", findOrCreateUser(controller.creategame));
  messageHandler.on("startgame", findOrCreateUser(controller.startgame));
  messageHandler.on("joingame", findOrCreateUser(controller.joingame));
  messageHandler.on("infogame", findOrCreateUser(controller.infogame));
  messageHandler.on("endgame", findOrCreateUser(controller.endgame));

  messageHandler.on("leavegame", isDMChat(controller.leavegame));
  messageHandler.on("play", isDMChat(controller.play));
  messageHandler.on("say", isDMChat(controller.say));
  messageHandler.on("cards", isDMChat(controller.cards));
  messageHandler.on("draw", isDMChat(controller.draw));

  return messageHandler;
}
