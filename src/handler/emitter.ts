import EventEmitter from "events";
import { getController } from "./controller";

import { findOrCreateUser, isDMChat } from "../utils";
import { handleHelpCommand } from "./help";

/**
 * Event emitter constructor that can be used by the "bone"
 * @param controller List of all controllers object
 * @returns Event emitter instance that used for handling command to the actual controller
 */
export const emitHandler = (
  controller: Awaited<ReturnType<typeof getController>>
) => {
  const messageHandler = new EventEmitter();

  messageHandler.on("creategame", findOrCreateUser(controller.creategame));
  messageHandler.on("joingame", findOrCreateUser(controller.joingame));
  messageHandler.on("infogame", findOrCreateUser(controller.infogame));

  messageHandler.on(
    "startgame",
    isDMChat(findOrCreateUser(controller.startgame))
  );
  messageHandler.on("endgame", isDMChat(findOrCreateUser(controller.endgame)));
  messageHandler.on(
    "leavegame",
    isDMChat(findOrCreateUser(controller.leavegame))
  );
  messageHandler.on("play", isDMChat(findOrCreateUser(controller.play)));
  messageHandler.on("say", isDMChat(findOrCreateUser(controller.say)));
  messageHandler.on("cards", isDMChat(findOrCreateUser(controller.cards)));
  messageHandler.on("draw", isDMChat(findOrCreateUser(controller.draw)));
  messageHandler.on("kick", isDMChat(findOrCreateUser(controller.kick)));
  messageHandler.on("ban", isDMChat(findOrCreateUser(controller.ban)));

  messageHandler.on("help", handleHelpCommand(controller));

  return messageHandler;
};
