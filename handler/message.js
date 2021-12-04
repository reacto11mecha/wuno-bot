// import emitHandler from "../routes/message.js";

// const handler = emitHandler();

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

  switch (command) {
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
