import getControllers from "../controller/index.js";
import emitHandler from "../routes/message.js";

import { Chat } from "../lib/index.js";

const messageHandler = async (client) => {
  const controller = await getControllers();
  const handler = emitHandler(controller);

  return async (message, logger) => {
    const command = message.body
      .slice(process.env.PREFIX.length)
      .trim()
      .split(/ +/)
      .shift()
      .toLowerCase();

    const chat = new Chat(client, message, logger);

    switch (command) {
      case "c":
      case "cg":
      case "create":
      case "creategame":
        return handler.emit("creategame", chat);
      case "s":
      case "sg":
      case "start":
      case "startgame":
        return handler.emit("startgame", chat);
      case "j":
      case "jg":
      case "join":
      case "joingame":
        return handler.emit("joingame", chat);
      case "i":
      case "ig":
      case "info":
      case "infogame":
        return handler.emit("infogame", chat);
      case "eg":
      case "end":
      case "endgame":
        return handler.emit("endgame", chat);

      case "l":
      case "lg":
      case "quit":
      case "leave":
      case "leavegame":
        return handler.emit("leavegame", chat);
      case "p":
      case "play":
        return handler.emit("play", chat);
      case "say":
        return handler.emit("say", chat);
      case "cards":
        return handler.emit("cards", chat);
      case "d":
      case "pickup":
      case "newcard":
      case "draw":
        return handler.emit("draw", chat);

      default:
        await chat.replyToCurrentPerson(
          command.length > 0
            ? `Tidak ada perintah yang bernama '${command}'`
            : "Under development"
        );
    }

    return true;
  };
};

export default messageHandler;
