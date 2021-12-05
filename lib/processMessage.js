const isDMChat = (message) => message.from.endsWith("@c.us");
const isGroupChat = (message) => message.from.endsWith("@g.us");

const isChat = (message) => message.type === "chat";

const checkValidMessage = (message) =>
  message.body.startsWith(process.env.PREFIX);

const _processMessage = (queue, proc, logger) => (message) => {
  if (isChat(message)) {
    if (checkValidMessage(message)) {
      logger.info(`[Pesan] Ada pesan dari: ${message.sender.pushname}`);
      queue.add(() => proc(message, logger));
    } else if (isDMChat(message)) {
      console.log("DM");
    }
  }
};

export { checkValidMessage, isChat, isGroupChat, isDMChat };
export default _processMessage;
