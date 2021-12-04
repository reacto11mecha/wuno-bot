import emitHandler from "../routes/message.js";

const handler = emitHandler();

const messageHandler = (client) => async (message, logger) => {
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
    case "sg":
    case "start":
    case "startgame":
      return await handler.emit("startgame", commonArgs);
    case "j":
    case "jg":
    case "join":
    case "joingame":
      return await handler.emit("joingame", commonArgs);

    case "lg":
    case "quit":
    case "leave":
    case "leavegame":
      return await handler.emit("leavegame", commonArgs);
    case "p":
    case "play":
      return await handler.emit("play", commonArgs);
    case "say":
      return await handler.emit("say", commonArgs);
    case "cards":
      return await handler.emit("cards", commonArgs);
    case "d":
    case "pickup":
    case "newcard":
    case "draw":
      return await handler.emit("draw", commonArgs);

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

export default messageHandler;
