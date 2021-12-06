import getControllers from "../controller/index.js";
import emitHandler from "../routes/message.js";

const messageHandler = async (client) => {
  const controller = await getControllers();
  const handler = emitHandler(controller);

  return async (message, logger) => {
    const { body, from, sender, id } = message;
    const userNumber = `+${sender.id.replace("@c.us", "")}`;

    const command = body
      .slice(process.env.PREFIX.length)
      .trim()
      .split(/ +/)
      .shift()
      .toLowerCase();
    const args = body
      .slice(process.env.PREFIX.length)
      .trim()
      .split(/ +/)
      .slice(1);

    // Common args
    const commonArgs = {
      body,
      from,
      sender,
      id,
      userNumber,
      args,
      message,
      client,
      logger,
    };

    switch (command) {
      case "c":
      case "cg":
      case "create":
      case "creategame":
        return handler.emit("creategame", commonArgs);
      case "s":
      case "sg":
      case "start":
      case "startgame":
        return handler.emit("startgame", commonArgs);
      case "j":
      case "jg":
      case "join":
      case "joingame":
        return handler.emit("joingame", commonArgs);
      case "i":
      case "ig":
      case "info":
      case "infogame":
        return handler.emit("infogame", commonArgs);
      case "eg":
      case "end":
      case "endgame":
        return handler.emit("endgame", commonArgs);

      case "l":
      case "lg":
      case "quit":
      case "leave":
      case "leavegame":
        return handler.emit("leavegame", commonArgs);
      case "p":
      case "play":
        return handler.emit("play", commonArgs);
      case "say":
        return handler.emit("say", commonArgs);
      case "cards":
        return handler.emit("cards", commonArgs);
      case "d":
      case "pickup":
      case "newcard":
      case "draw":
        return handler.emit("draw", commonArgs);

      default:
        await client.simulateTyping(from, true);
        await client.reply(
          from,
          command.length > 0
            ? `Tidak ada perintah yang bernama '${command}'`
            : "Under development",
          id,
          true
        );
        await client.simulateTyping(from, false);
    }

    return true;
  };
};

export default messageHandler;
