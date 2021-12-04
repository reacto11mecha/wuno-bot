const checkValidMessage = (message) =>
  message.type === "chat" && message.body.startsWith(process.env.PREFIX);

const _processMessage = (queue, proc, logger) => (message) => {
  if (checkValidMessage(message)) {
    logger.info(`[Pesan] Ada pesan dari : ${message.sender.pushname}`);
    queue.add(() => proc(message, logger));
  }
};

export default _processMessage;
