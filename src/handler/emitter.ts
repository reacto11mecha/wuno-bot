import EventEmitter from "events";
import { getController } from "./controller";

import { findOrCreateUser, isDMChat } from "../utils";
import { handleHelpCommand } from "./help";

export const emitHandler = (
  controller: Awaited<ReturnType<typeof getController>>
) => {
  const messageHandler = new EventEmitter();

  messageHandler.on("creategame", findOrCreateUser(controller.creategame));
  messageHandler.on("startgame", findOrCreateUser(controller.startgame));
  messageHandler.on("joingame", findOrCreateUser(controller.joingame));
  messageHandler.on("infogame", findOrCreateUser(controller.infogame));
  messageHandler.on("endgame", findOrCreateUser(controller.endgame));

  messageHandler.on(
    "leavegame",
    isDMChat(findOrCreateUser(controller.leavegame))
  );
  messageHandler.on("play", isDMChat(findOrCreateUser(controller.play)));
  messageHandler.on("say", isDMChat(findOrCreateUser(controller.say)));
  messageHandler.on("cards", isDMChat(findOrCreateUser(controller.cards)));
  messageHandler.on("draw", isDMChat(findOrCreateUser(controller.draw)));
  messageHandler.on("kick", isDMChat(findOrCreateUser(controller.kick)));

  messageHandler.on("help", handleHelpCommand(controller));

  return messageHandler;
};
