import EventEmitter from "events";
import { getController } from "./controller";

import { findOrCreateUser } from "../utils";

export const emitHandler = (
  controller: Awaited<ReturnType<typeof getController>>
) => {
  const messageHandler = new EventEmitter();

  messageHandler.on("creategame", findOrCreateUser(controller.creategame));
  messageHandler.on("startgame", findOrCreateUser(controller.startgame));
  messageHandler.on("joingame", findOrCreateUser(controller.joingame));
  messageHandler.on("infogame", findOrCreateUser(controller.infogame));
  messageHandler.on("endgame", findOrCreateUser(controller.endgame));

  return messageHandler;
};
