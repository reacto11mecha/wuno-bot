import EventEmitter from "events";
import { getController } from "./controller";

import { findOrCreateUser } from "../utils";

export const emitHandler = (
  controller: Awaited<ReturnType<typeof getController>>
) => {
  const messageHandler = new EventEmitter();

  messageHandler.on("creategame", findOrCreateUser(controller.creategame));

  return messageHandler;
};
